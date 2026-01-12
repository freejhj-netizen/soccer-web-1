import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TextEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, subtitle: string, content: string) => void;
  initialTitle?: string;
  initialSubtitle?: string;
  initialContent?: string;
  showSubtitle?: boolean;
  pinned?: boolean;
  onPinnedChange?: (pinned: boolean) => void;
  showPinned?: boolean;
}

export const TextEditModal: React.FC<TextEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTitle = '',
  initialSubtitle = '',
  initialContent = '',
  showSubtitle = false,
  pinned = false,
  onPinnedChange,
  showPinned = false,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [imageUploading, setImageUploading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setSubtitle(initialSubtitle);
      // 모달이 완전히 열린 후 에디터 내용을 설정하도록 지연
      const timer = setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = initialContent || '';
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // 모달이 닫힐 때 내용 초기화
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
  }, [isOpen, initialTitle, initialSubtitle, initialContent]);

  const handleSave = () => {
    const content = editorRef.current?.innerHTML || '';
    onSave(title, subtitle, content);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editorRef.current) return;

    setImageUploading(true);
    try {
      // 이미지를 base64로 변환하여 에디터에 삽입
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        document.execCommand('insertImage', false, img.src);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editorRef.current) return;

    setFileUploading(true);
    try {
      // 파일을 링크로 삽입
      const fileName = file.name;
      const fileUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.textContent = fileName;
      link.download = fileName;
      document.execCommand('insertHTML', false, link.outerHTML);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setFileUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleColorChange = (color: string) => {
    document.execCommand('foreColor', false, color);
    editorRef.current?.focus();
  };

  const handleFontSizeChange = (size: string) => {
    document.execCommand('fontSize', false, size);
    editorRef.current?.focus();
  };

  const colors = [
    '#FFFFFF', '#000000', '#FFD700', '#FF0000', '#0000FF', '#00FF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#FFFF00', '#008000', '#000080',
    '#FF1493', '#00CED1', '#FF6347', '#32CD32'
  ];

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-gray-900 border border-gray-800 shadow-xl transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-4 border-b border-gray-800">
                  <Dialog.Title className="text-xl font-semibold text-white">내용 수정</Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-md text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input-field"
                      placeholder="제목을 입력하세요"
                    />
                  </div>

                  {showSubtitle && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">부제목</label>
                      <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        className="input-field"
                        placeholder="부제목을 입력하세요"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">내용</label>
                    
                    {/* 툴바 */}
                    <div className="space-y-2">
                      {/* 첫 번째 줄: 기본 서식 */}
                      <div className="flex flex-wrap gap-2 p-2 bg-gray-800 rounded-t-lg border-b border-gray-700">
                        <button
                          type="button"
                          onClick={() => execCommand('bold')}
                          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                          title="굵게"
                        >
                          <strong>B</strong>
                        </button>
                        <button
                          type="button"
                          onClick={() => execCommand('italic')}
                          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                          title="기울임"
                        >
                          <em>I</em>
                        </button>
                        <button
                          type="button"
                          onClick={() => execCommand('underline')}
                          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                          title="밑줄"
                        >
                          <u>U</u>
                        </button>
                        <div className="w-px h-6 bg-gray-600" />
                        
                        {/* 글자색 선택 */}
                        <div className="relative group">
                          <button
                            type="button"
                            className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                            title="글자색"
                          >
                            🎨 색상
                          </button>
                          <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg p-2 grid grid-cols-5 gap-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                            {colors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => handleColorChange(color)}
                                className="w-6 h-6 rounded border border-gray-600 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>

                        {/* 글자크기 선택 */}
                        <select
                          onChange={(e) => handleFontSizeChange(e.target.value)}
                          className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm border-none outline-none"
                          title="글자크기"
                        >
                          <option value="">크기</option>
                          {Array.from({ length: 50 }, (_, i) => i + 1).map((size) => (
                            <option key={size} value={size.toString()}>
                              {size}
                            </option>
                          ))}
                        </select>

                        <div className="w-px h-6 bg-gray-600" />
                        <button
                          type="button"
                          onClick={() => execCommand('justifyLeft')}
                          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                          title="왼쪽 정렬"
                        >
                          ⬅
                        </button>
                        <button
                          type="button"
                          onClick={() => execCommand('justifyCenter')}
                          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                          title="가운데 정렬"
                        >
                          ⬌
                        </button>
                        <button
                          type="button"
                          onClick={() => execCommand('justifyRight')}
                          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                          title="오른쪽 정렬"
                        >
                          ➡
                        </button>
                        <div className="w-px h-6 bg-gray-600" />
                        <button
                          type="button"
                          onClick={() => execCommand('insertUnorderedList')}
                          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                          title="목록"
                        >
                          •
                        </button>
                        <button
                          type="button"
                          onClick={() => execCommand('insertOrderedList')}
                          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                          title="번호 목록"
                        >
                          1.
                        </button>
                        <div className="w-px h-6 bg-gray-600" />
                        <label className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm cursor-pointer">
                          📷 이미지
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={imageUploading}
                          />
                        </label>
                        <label className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm cursor-pointer">
                          📎 파일
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={fileUploading}
                          />
                        </label>
                      </div>
                    </div>

                    {/* 에디터 */}
                    <div
                      ref={editorRef}
                      contentEditable
                      className="min-h-[300px] p-4 bg-gray-800 text-white rounded-b-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gold overflow-y-auto"
                      style={{ whiteSpace: 'pre-wrap' }}
                      suppressContentEditableWarning={true}
                    />
                  </div>

                  {/* 고정 체크박스 */}
                  {showPinned && onPinnedChange && (
                    <div className="flex items-center pt-4 border-t border-gray-800">
                      <input
                        type="checkbox"
                        id="pinned-modal"
                        checked={pinned}
                        onChange={(e) => {
                          e.stopPropagation();
                          onPinnedChange(e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-gold bg-gray-700 border-gray-600 rounded focus:ring-gold"
                      />
                      <label 
                        htmlFor="pinned-modal" 
                        className="ml-2 text-sm text-gray-300 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        고정 (공지사항 목록 상단에 표시)
                      </label>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-800">
                    <button
                      onClick={onClose}
                      className="btn-secondary"
                      disabled={imageUploading || fileUploading}
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSave}
                      className="btn-primary"
                      disabled={imageUploading || fileUploading}
                    >
                      저장
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

