import React, { useRef, useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._\uAC00-\uD7A3-]/g, '_');

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertHtmlAtCursor = (html: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer)) {
        range.selectNodeContents(editor);
        range.collapse(false);
      }
      range.deleteContents();
      const fragment = range.createContextualFragment(html);
      range.insertNode(fragment);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editor.insertAdjacentHTML('beforeend', html);
    }

    updateContent();
  };

  const getUploadErrorMessage = (error: unknown) => {
    const err = error as { code?: string; message?: string };
    if (err.code === 'storage/unauthorized') {
      return '업로드 권한이 없습니다. 관리자 계정으로 로그인했는지 확인하세요.';
    }
    if (err.code === 'storage/canceled') {
      return '업로드가 취소되었습니다.';
    }
    if (err.code === 'storage/quota-exceeded') {
      return '저장 공간이 부족합니다.';
    }
    return err.message || '알 수 없는 오류가 발생했습니다.';
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!storage) {
      alert('Firebase Storage가 설정되지 않았습니다.');
      return;
    }

    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|svg|heic|heif)$/i.test(file.name);
    if (!isImage) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }

    setIsUploading(true);
    try {
      const safeName = sanitizeFileName(file.name);
      const storageRef = ref(storage, `posts/images/${Date.now()}_${safeName}`);
      const contentType = file.type || 'image/jpeg';
      await uploadBytes(storageRef, file, { contentType });
      const url = await getDownloadURL(storageRef);

      const html = `<p><img src="${url}" alt="${file.name.replace(/"/g, '&quot;')}" style="max-width:100%;height:auto;display:block;margin:8px 0;border-radius:4px;" /></p>`;
      insertHtmlAtCursor(html);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`이미지 업로드에 실패했습니다.\n${getUploadErrorMessage(error)}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!storage) {
      alert('Firebase Storage가 설정되지 않았습니다.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('파일 크기는 25MB 이하여야 합니다.');
      return;
    }

    setIsUploading(true);
    try {
      const safeName = sanitizeFileName(file.name);
      const storageRef = ref(storage, `posts/files/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, file, {
        contentType: file.type || 'application/octet-stream',
      });
      const url = await getDownloadURL(storageRef);

      const displayName = file.name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const html = `<p><a href="${url}" target="_blank" rel="noopener noreferrer" download="${displayName}" style="color:#60a5fa;text-decoration:underline;">📎 ${displayName}</a></p>`;
      insertHtmlAtCursor(html);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`파일 업로드에 실패했습니다.\n${getUploadErrorMessage(error)}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const colors = [
    { name: '검정', value: '#000000' },
    { name: '빨강', value: '#FF0000' },
    { name: '파랑', value: '#0000FF' },
    { name: '초록', value: '#008000' },
    { name: '노랑', value: '#FFFF00' },
    { name: '주황', value: '#FFA500' },
    { name: '보라', value: '#800080' },
    { name: '분홍', value: '#FFC0CB' },
    { name: '갈색', value: '#A52A2A' },
    { name: '회색', value: '#808080' },
  ];

  return (
    <div className="border border-gray-700 rounded-lg bg-gray-900">
      <div className="border-b border-gray-700 p-2 flex flex-wrap items-center gap-2 bg-gray-800">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm font-bold"
          title="굵게"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm italic"
          title="기울이기"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm underline"
          title="밑줄"
        >
          U
        </button>

        <div className="w-px h-6 bg-gray-600" />

        <select
          onChange={(e) => {
            const size = e.target.value;
            if (size) execCommand('fontSize', size);
            e.target.value = '';
          }}
          className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
          title="글자 크기"
          defaultValue=""
        >
          <option value="">크기</option>
          {Array.from({ length: 50 }, (_, i) => i + 1).map((size) => (
            <option key={size} value={size.toString()}>
              {size}
            </option>
          ))}
        </select>

        <select
          onChange={(e) => {
            const color = e.target.value;
            if (color) execCommand('foreColor', color);
            e.target.value = '';
          }}
          className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
          title="색상"
          defaultValue=""
        >
          <option value="">색상</option>
          {colors.map((color) => (
            <option key={color.value} value={color.value}>
              {color.name}
            </option>
          ))}
        </select>

        <div className="w-px h-6 bg-gray-600" />

        <label className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm cursor-pointer">
          {isUploading ? '업로드 중...' : '이미지'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
        </label>

        <label className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm cursor-pointer">
          {isUploading ? '업로드 중...' : '파일'}
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      <div
        ref={editorRef}
        contentEditable
        className="min-h-[300px] p-4 text-white focus:outline-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_a]:text-blue-400 [&_a]:underline"
        style={{ whiteSpace: 'pre-wrap' }}
        onInput={updateContent}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;
