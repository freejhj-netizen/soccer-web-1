import React, { useRef, useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `posts/images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      execCommand('insertImage', url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `posts/files/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const link = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${file.name}</a>`;
      execCommand('insertHTML', link);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
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
      {/* 툴바 */}
      <div className="border-b border-gray-700 p-2 flex flex-wrap items-center gap-2 bg-gray-800">
        {/* 텍스트 스타일 */}
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

        <div className="w-px h-6 bg-gray-600"></div>

        {/* 글자 크기 */}
        <select
          onChange={(e) => {
            const size = e.target.value;
            if (size) {
              execCommand('fontSize', size);
            }
          }}
          className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
          title="글자 크기"
        >
          <option value="">크기</option>
          {Array.from({ length: 50 }, (_, i) => i + 1).map((size) => (
            <option key={size} value={size.toString()}>
              {size}
            </option>
          ))}
        </select>

        {/* 색상 */}
        <select
          onChange={(e) => {
            const color = e.target.value;
            if (color) {
              execCommand('foreColor', color);
            }
          }}
          className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
          title="색상"
        >
          <option value="">색상</option>
          {colors.map((color) => (
            <option key={color.value} value={color.value}>
              {color.name}
            </option>
          ))}
        </select>

        <div className="w-px h-6 bg-gray-600"></div>

        {/* 이미지 첨부 */}
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

        {/* 파일 첨부 */}
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

      {/* 에디터 영역 */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[300px] p-4 text-white focus:outline-none"
        style={{ whiteSpace: 'pre-wrap' }}
        onInput={updateContent}
      />
    </div>
  );
};

export default RichTextEditor;

