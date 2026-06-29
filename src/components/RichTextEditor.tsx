/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  Bold, Italic, Underline, Heading1, Heading2, AlignLeft, AlignCenter, 
  AlignRight, List, ListOrdered, Link, Image, Quote, Code, Minus, 
  Undo, Redo, Sparkles, Code2, Eye
} from 'lucide-react';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onAutoSave?: () => void;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your story here...",
  onAutoSave
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isCodeView, setIsCodeView] = useState(false);
  const [codeValue, setCodeValue] = useState(value);
  const [uploading, setUploading] = useState(false);

  // Sync value to editor content if it changes externally
  useEffect(() => {
    if (editorRef.current && !isCodeView) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    setCodeValue(value);
  }, [value, isCodeView]);

  // Handle changes in Visual Mode
  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      setCodeValue(html);
    }
  };

  // Handle changes in Code Mode
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const html = e.target.value;
    setCodeValue(html);
    onChange(html);
  };

  // Formatting helper function
  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    handleInput();
  };

  // Format with elements that require CSS classes
  const formatBlock = (tag: string) => {
    execCommand('formatBlock', tag);
  };

  // Link handler
  const handleCreateLink = () => {
    const url = prompt("Enter the URL:");
    if (url) {
      execCommand('createLink', url);
    }
  };

  // Image insertion (Direct link or Upload)
  const handleInsertImage = async () => {
    const method = confirm("Click OK to upload from your device, or Cancel to paste an Image URL.");
    if (method) {
      // Upload file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
          const fileRef = ref(storage, `chapters/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(fileRef, file);
          const downloadUrl = await getDownloadURL(snapshot.ref);
          
          insertImageAtCursor(downloadUrl);
        } catch (error) {
          console.error("Storage upload failed, falling back to manual input. Error details: ", error);
          const manualUrl = prompt("Upload failed or Storage is not active yet. Please enter an Image URL instead:");
          if (manualUrl) {
            insertImageAtCursor(manualUrl);
          }
        } finally {
          setUploading(false);
        }
      };
      input.click();
    } else {
      // Paste URL
      const url = prompt("Enter Image URL:");
      if (url) {
        insertImageAtCursor(url);
      }
    }
  };

  const insertImageAtCursor = (url: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const imgHtml = `<img src="${url}" class="rounded-xl my-6 max-w-full mx-auto shadow-md border border-gray-100 dark:border-gray-800 transition-all hover:scale-[1.01]" alt="chapter-image" referrerPolicy="no-referrer" loading="lazy" />`;
    execCommand('insertHTML', imgHtml);
  };

  // Paste handler: Clean up Word, Google Docs, or HTML junk
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');

    if (html) {
      // Clean word/google docs markup but preserve bold, italic, lists, headings
      let cleanHtml = html
        .replace(/<!--[\s\S]*?-->/g, '') // strip comments
        .replace(/<style([\s\S]*?)<\/style>/gi, '') // strip style blocks
        .replace(/class="([\s\S]*?)"/gi, '') // strip classes
        .replace(/style="([\s\S]*?)"/gi, '') // strip inline styles
        .replace(/id="([\s\S]*?)"/gi, '') // strip ids
        .replace(/&nbsp;/gi, ' ') // convert nbsp to space
        .replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1') // remove span wrappers but keep text
        .replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, '$1'); // remove font wrappers

      // Insert clean HTML
      execCommand('insertHTML', cleanHtml);
    } else {
      // Insert plain text converted to line breaks
      const cleanText = text
        .replace(/\r\n/g, '\n')
        .replace(/\n/g, '<br />');
      execCommand('insertHTML', cleanText);
    }
  };

  return (
    <div className="w-full border border-gray-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#090d16] shadow-sm overflow-hidden flex flex-col">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-[#121b2d]/50 px-2 py-1.5 gap-1 select-none">
        <div className="flex flex-wrap items-center gap-1">
          {/* Visual/Code View Toggle */}
          <button
            type="button"
            onClick={() => setIsCodeView(!isCodeView)}
            className={`p-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              isCodeView 
                ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#121b2d]'
            }`}
            title={isCodeView ? "Switch to Visual Editor" : "Switch to Code/HTML View"}
            id="editor-view-toggle"
          >
            {isCodeView ? (
              <>
                <Eye className="h-4 w-4" />
                <span className="text-xs">Visual</span>
              </>
            ) : (
              <>
                <Code2 className="h-4 w-4" />
                <span className="text-xs">HTML Code</span>
              </>
            )}
          </button>

          <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />

          {!isCodeView && (
            <>
              {/* Text Formats */}
              <button
                type="button"
                onClick={() => execCommand('bold')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Bold"
                id="editor-bold-btn"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCommand('italic')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Italic"
                id="editor-italic-btn"
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCommand('underline')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Underline"
                id="editor-underline-btn"
              >
                <Underline className="h-4 w-4" />
              </button>

              <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />

              {/* Headings */}
              <button
                type="button"
                onClick={() => formatBlock('H2')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer font-bold"
                title="Heading 1"
                id="editor-h1-btn"
              >
                <Heading1 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => formatBlock('H3')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer font-bold"
                title="Heading 2"
                id="editor-h2-btn"
              >
                <Heading2 className="h-4 w-4" />
              </button>

              <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />

              {/* Alignments */}
              <button
                type="button"
                onClick={() => execCommand('justifyLeft')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Align Left"
                id="editor-align-left-btn"
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCommand('justifyCenter')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Align Center"
                id="editor-align-center-btn"
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCommand('justifyRight')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Align Right"
                id="editor-align-right-btn"
              >
                <AlignRight className="h-4 w-4" />
              </button>

              <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />

              {/* Lists */}
              <button
                type="button"
                onClick={() => execCommand('insertUnorderedList')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Unordered List"
                id="editor-ul-btn"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCommand('insertOrderedList')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Ordered List"
                id="editor-ol-btn"
              >
                <ListOrdered className="h-4 w-4" />
              </button>

              <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />

              {/* Rich Blocks */}
              <button
                type="button"
                onClick={() => formatBlock('blockquote')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Quote Block"
                id="editor-quote-btn"
              >
                <Quote className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => formatBlock('pre')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Code Block"
                id="editor-code-btn"
              >
                <Code className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCommand('insertHorizontalRule')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Horizontal Line"
                id="editor-hr-btn"
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />

              {/* Links & Images */}
              <button
                type="button"
                onClick={handleCreateLink}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Insert Link"
                id="editor-link-btn"
              >
                <Link className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer flex items-center gap-1"
                title="Insert Image"
                id="editor-image-btn"
              >
                <Image className="h-4 w-4" />
              </button>

              <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />

              {/* Undo/Redo */}
              <button
                type="button"
                onClick={() => execCommand('undo')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Undo"
                id="editor-undo-btn"
              >
                <Undo className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCommand('redo')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#121b2d] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Redo"
                id="editor-redo-btn"
              >
                <Redo className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {uploading && (
          <span className="text-xs text-indigo-600 dark:text-indigo-400 animate-pulse font-medium">
            Uploading image...
          </span>
        )}
      </div>

      {/* Editor Main Content Area */}
      <div className="flex-grow relative min-h-[400px] flex flex-col bg-white dark:bg-[#090d16]">
        {isCodeView ? (
          <textarea
            value={codeValue}
            onChange={handleCodeChange}
            placeholder="Write raw HTML here..."
            className="w-full flex-grow p-6 font-mono text-sm bg-gray-900 text-green-400 border-none outline-none focus:ring-0 resize-none min-h-[400px]"
            id="editor-html-textarea"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            className="w-full flex-grow p-6 outline-none overflow-y-auto min-h-[400px] prose dark:prose-invert max-w-none focus:ring-0 text-gray-800 dark:text-gray-200"
            style={{
              fontFamily: '"Inter", sans-serif',
              lineHeight: '1.75'
            }}
            placeholder={placeholder}
            id="editor-visual-div"
          />
        )}
        
        {/* Placeholder label styling */}
        {!isCodeView && (!value || value === '<br>' || value === '') && (
          <div className="absolute top-6 left-6 text-gray-400 pointer-events-none select-none text-base">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
