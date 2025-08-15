import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Placeholder } from '@tiptap/extension-placeholder';
import { ListItem } from '@tiptap/extension-list-item';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { Blockquote } from '@tiptap/extension-blockquote';
import { TextSelection } from 'prosemirror-state';
import { getMarkRange } from '@tiptap/core';
import { Button } from './button';
import toast from 'react-hot-toast';
import { Separator } from './separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './dialog';
import { Input } from './input';
import { Label } from './label';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Palette,
  Highlighter,
  Undo,
  Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  showToolbar?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  className,
  editable = true,
  showToolbar = true,
}) => {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [lastLinkClick, setLastLinkClick] = useState<{
    href: string;
    time: number;
  } | null>(null);
  const [showLinkBubble, setShowLinkBubble] = useState(false);
  const [bubblePos, setBubblePos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);

  // Function to trigger re-render
  const triggerReRender = () => forceUpdate((prev) => prev + 1);

  const colors = [
    '#000000',
    '#374151',
    '#6B7280',
    '#9CA3AF',
    '#D1D5DB',
    '#EF4444',
    '#F97316',
    '#EAB308',
    '#22C55E',
    '#06B6D4',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#F43F5E',
    '#84CC16',
  ];

  // Normalize and sanitize URL input (auto add https://, strip stray quotes and leading slashes)
  const normalizeUrl = (url: string) => {
    let u = (url || '').trim().replace(/^'+|'+$/g, '');
    if (!u) return u;
    // Remove leading spaces/quotes and stray starting slashes like '/www...'
    u = u.replace(/^\/+/, '');
    // If protocol missing, default to https
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(u)) {
      u = `https://${u}`;
    }
    return u;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable the default list extensions to use our custom ones
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'left',
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      // Add specific list extensions for better control
      ListItem,
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc list-outside ml-4',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal list-outside ml-4',
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-gray-300 pl-4 italic',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    // Ensure immediate updates for marks and selection changes
    onSelectionUpdate: ({ editor }) => {
      // This callback ensures the component re-renders when selection changes
      // which updates button active states without needing manual state management
      triggerReRender();
      const isLink = editor.isActive('link');
      setShowLinkBubble(isLink);
    },
    editorProps: {
      // Space exits link mode: always insert a space just after the link
      handleKeyDown: (view, event) => {
        const e = event as KeyboardEvent;
        if (view.composing) return false;
        if (!(e.key === ' ' || e.key === 'Spacebar')) return false;

        const { state } = view;
        const markType = state.schema.marks.link;
        if (!markType || !(state.selection instanceof TextSelection))
          return false;
        const sel = state.selection as TextSelection;

        let insertPos: number | null = null;

        if (sel.empty) {
          const $pos = state.doc.resolve(sel.from);
          // If caret is anywhere inside a link, place space at the end of that link
          const inRange = getMarkRange($pos, markType);
          if (inRange) {
            insertPos = inRange.to;
          } else {
            // Boundary case: caret immediately after a link
            const before = $pos.nodeBefore;
            const hasBeforeLink = !!before?.marks?.some(
              (m) => m.type === markType,
            );
            if (hasBeforeLink) insertPos = sel.from; // already outside; just insert here
          }
        } else {
          // If a range is selected and starts in a link, insert space at end of link
          const $from = state.doc.resolve(sel.from);
          const range = getMarkRange($from, markType);
          if (range) insertPos = range.to;
        }

        if (insertPos == null) return false; // not related to a link

        const tr = state.tr;
        tr.removeStoredMark(markType);
        tr.insertText(' ', insertPos);
        view.dispatch(
          tr.setSelection(TextSelection.create(tr.doc, insertPos + 1)),
        );
        setShowLinkBubble(false);
        e.preventDefault();
        return true;
      },
      // Click once on a link: select it and show bubble menu; click again quickly: open it
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement | null;
        const anchor = target?.closest('a') as HTMLAnchorElement | null;
        if (!anchor) return false;

        const href = anchor.getAttribute('href') || '';
        // Double-click style: second click within 800ms opens link
        if (
          lastLinkClick &&
          lastLinkClick.href === href &&
          Date.now() - lastLinkClick.time < 800
        ) {
          const url = normalizeUrl(href);
          window.open(url, '_blank', 'noopener,noreferrer');
          setLastLinkClick(null);
          return true;
        }

        setLastLinkClick({ href, time: Date.now() });

        // Select entire link range
        const { state } = view;
        const $pos = state.doc.resolve(pos);
        const markType = state.schema.marks.link;
        const range = markType ? getMarkRange($pos, markType) : null;
        if (range) {
          const tr = state.tr.setSelection(
            TextSelection.create(state.doc, range.from, range.to),
          );
          view.dispatch(tr);
          // Show bubble and position it
          setTimeout(() => {
            setShowLinkBubble(true);
            const rect = wrapperRef.current?.getBoundingClientRect();
            try {
              // Position bubble centered above the link
              const start = view.coordsAtPos(range.from);
              const end = view.coordsAtPos(range.to);
              const midX = (start.left + end.left) / 2;
              const left = midX - (rect?.left || 0);
              const top = Math.min(start.top, end.top) - (rect?.top || 0) - 48; // above the link
              setBubblePos({ left, top });
            } catch (err) {
              // ignore positioning errors
              console.debug('Bubble position error', err);
            }
          }, 0);
          return true;
        }
        return false;
      },
    },
  });

  // Handle content updates from props (especially for edit mode)
  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      // If content is HTML, set it directly
      if (content.includes('<') && content.includes('>')) {
        editor.commands.setContent(content, { emitUpdate: false });
      } else {
        // If content is JSON or plain text, try to parse it
        try {
          const parsed = JSON.parse(content);
          editor.commands.setContent(parsed, { emitUpdate: false });
        } catch {
          // If parsing fails, treat as plain text
          editor.commands.setContent(content, { emitUpdate: false });
        }
      }
    }
  }, [editor, content]);

  // Hide bubble when clicking outside editor or not on a link
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const inWrapper = !!wrapperRef.current?.contains(t);
      const inBubble = !!bubbleRef.current?.contains(t as Node);
      if (!inWrapper && !inBubble) {
        setShowLinkBubble(false);
      } else if (inWrapper && !inBubble && !t?.closest('a')) {
        // Clicked inside editor but not on a link and not inside bubble
        setShowLinkBubble(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Function handleSetLink (cho link dialog) - Google Docs style: text + URL
  const handleSetLink = () => {
    if (!editor || editor.view.composing) return;
    const rawUrl = linkUrl.trim();
    if (!rawUrl) return;
    const url = normalizeUrl(rawUrl);

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    const text = (linkText || selectedText || url).trim();

    editor.chain().focus();

    if (from === to) {
      // No selection: insert new linked text
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text,
          marks: [
            {
              type: 'link',
              attrs: { href: url },
            },
          ],
        })
        .run();
    } else {
      // Replace selection text if changed, then set link
      if (text !== selectedText) {
        editor
          .chain()
          .insertContent(text)
          .setTextSelection({ from, to: from + text.length })
          .run();
      }
      editor.chain().setLink({ href: url }).run();
    }

    setLinkUrl('');
    setLinkText('');
    setIsLinkDialogOpen(false);

    // Restore focus sau đóng dialog
    setTimeout(() => {
      if (editor) editor.view.focus();
    }, 0); // Delay nhỏ để dialog đóng hoàn toàn
  };

  // Function handleColorSelect (cho color dialog)
  const handleColorSelect = (color: string) => {
    if (!editor || editor.view.composing) return; // Thêm check composing

    editor.chain().focus().setColor(color).run();
    setIsColorPaletteOpen(false);

    // Restore focus sau đóng dialog
    setTimeout(() => {
      if (editor) editor.view.focus();
    }, 0);
  };

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    tooltip,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    tooltip: string;
  }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
      // Force re-render immediately after the command to update button states
      setTimeout(() => triggerReRender(), 0);
    };

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isActive ? 'default' : 'ghost'}
              size='sm'
              onClick={handleClick}
              disabled={disabled}
              className='h-8 w-8 p-0'
              type='button'
            >
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div
      ref={wrapperRef}
      className={cn('border rounded-lg relative', className)}
    >
      {showToolbar && (
        <div className='border-b p-2 flex flex-wrap gap-1'>
          {/* Text formatting */}
          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().toggleBold().run();
            }}
            isActive={editor.isActive('bold')}
            tooltip='Bold'
          >
            <Bold className='h-4 w-4' />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().toggleItalic().run();
            }}
            isActive={editor.isActive('italic')}
            tooltip='Italic'
          >
            <Italic className='h-4 w-4' />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().toggleUnderline().run();
            }}
            isActive={editor.isActive('underline')}
            tooltip='Underline'
          >
            <UnderlineIcon className='h-4 w-4' />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().toggleStrike().run();
            }}
            isActive={editor.isActive('strike')}
            tooltip='Strikethrough'
          >
            <Strikethrough className='h-4 w-4' />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().toggleCode().run();
            }}
            isActive={editor.isActive('code')}
            tooltip='Code'
          >
            <Code className='h-4 w-4' />
          </ToolbarButton>

          <Separator orientation='vertical' className='h-8' />

          {/* Paragraph formatting */}
          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().toggleBlockquote().run();
            }}
            isActive={editor.isActive('blockquote')}
            tooltip='Quote'
          >
            <Quote className='h-4 w-4' />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().toggleBulletList().run();
            }}
            isActive={editor.isActive('bulletList')}
            tooltip='Bullet List'
          >
            <List className='h-4 w-4' />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().toggleOrderedList().run();
            }}
            isActive={editor.isActive('orderedList')}
            tooltip='Numbered List'
          >
            <ListOrdered className='h-4 w-4' />
          </ToolbarButton>

          <Separator orientation='vertical' className='h-8' />

          {/* Text alignment */}
          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().setTextAlign('left').run();
            }}
            isActive={editor.isActive({ textAlign: 'left' })}
            tooltip='Align Left'
          >
            <AlignLeft className='h-4 w-4' />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().setTextAlign('center').run();
            }}
            isActive={editor.isActive({ textAlign: 'center' })}
            tooltip='Align Center'
          >
            <AlignCenter className='h-4 w-4' />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().setTextAlign('right').run();
            }}
            isActive={editor.isActive({ textAlign: 'right' })}
            tooltip='Align Right'
          >
            <AlignRight className='h-4 w-4' />
          </ToolbarButton>

          <Separator orientation='vertical' className='h-8' />

          {/* Links and media */}
          <Dialog
            open={isLinkDialogOpen}
            onOpenChange={(open) => {
              setIsLinkDialogOpen(open);
              if (open && editor) {
                const { from, to } = editor.state.selection;
                setLinkText(editor.state.doc.textBetween(from, to));
                const currentHref = editor.getAttributes('link')?.href || '';
                setLinkUrl(currentHref);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant={editor.isActive('link') ? 'default' : 'ghost'}
                size='sm'
                className='h-8 w-8 p-0'
                type='button'
                aria-label='Insert link'
              >
                <LinkIcon className='h-4 w-4' />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Insert link</DialogTitle>
              </DialogHeader>
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='link-text'>Text</Label>
                  <Input
                    id='link-text'
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder='Text to display'
                  />
                </div>
                <div>
                  <Label htmlFor='link-url'>URL</Label>
                  <Input
                    id='link-url'
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder='https://example.com'
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  type='button'
                  onClick={() => setIsLinkDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='button' onClick={handleSetLink}>
                  Apply
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Separator orientation='vertical' className='h-8' />

          {/* Color and highlight */}
          <Dialog
            open={isColorPaletteOpen}
            onOpenChange={setIsColorPaletteOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0'
                type='button'
                // Xóa onMouseDown
              >
                <Palette className='h-4 w-4' />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Text Color</DialogTitle>
              </DialogHeader>
              <div className='grid grid-cols-5 gap-2 p-4'>
                {colors.map((color) => (
                  <button
                    key={color}
                    className='w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 focus:border-blue-500 focus:outline-none'
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                  />
                ))}
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setIsColorPaletteOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().toggleHighlight().run();
            }}
            isActive={editor.isActive('highlight')}
            tooltip='Highlight'
          >
            <Highlighter className='h-4 w-4' />
          </ToolbarButton>

          <Separator orientation='vertical' className='h-8' />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().undo().run();
            }}
            disabled={!editor.can().undo()}
            tooltip='Undo'
          >
            <Undo className='h-4 w-4' />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => {
              if (editor.view.composing) return;
              editor.chain().focus().redo().run();
            }}
            disabled={!editor.can().redo()}
            tooltip='Redo'
          >
            <Redo className='h-4 w-4' />
          </ToolbarButton>
        </div>
      )}

      {editor &&
        showLinkBubble &&
        editor.getAttributes('link')?.href &&
        bubblePos && (
          <div
            ref={bubbleRef}
            className='absolute z-20 rounded-lg border bg-white p-1 shadow-md flex items-center gap-1 text-xs -translate-x-1/2'
            style={{ top: bubblePos.top, left: bubblePos.left }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <span className='text-xs text-gray-600 truncate max-w-[180px]'>
              {normalizeUrl(editor.getAttributes('link')?.href || '')}
            </span>
            <Separator orientation='vertical' className='h-4' />
            <Button
              variant='ghost'
              size='sm'
              type='button'
              onClick={() => {
                const href = normalizeUrl(
                  editor.getAttributes('link')?.href || '',
                );
                if (href) {
                  navigator.clipboard?.writeText(href).then(
                    () => toast.success('Copied link to clipboard'),
                    () => toast.error('Failed to copy link'),
                  );
                }
              }}
              className='h-7 px-2 py-1 text-xs'
            >
              Copy
            </Button>
            <Button
              variant='ghost'
              size='sm'
              type='button'
              onClick={() => {
                const href = editor.getAttributes('link')?.href || '';
                setLinkUrl(href);
                const { from, to } = editor.state.selection;
                setLinkText(editor.state.doc.textBetween(from, to));
                setIsLinkDialogOpen(true);
                setShowLinkBubble(false);
              }}
              className='h-7 px-2 py-1 text-xs'
            >
              Edit
            </Button>
            <Button
              variant='ghost'
              size='sm'
              type='button'
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .extendMarkRange('link')
                  .unsetLink()
                  .run();
                setShowLinkBubble(false);
              }}
              className='h-7 px-2 py-1 text-xs'
            >
              Remove
            </Button>
            <Button
              variant='default'
              size='sm'
              type='button'
              onClick={() => {
                const href = normalizeUrl(
                  editor.getAttributes('link')?.href || '',
                );
                if (href) window.open(href, '_blank', 'noopener,noreferrer');
              }}
              className='h-7 px-2 py-1 text-xs'
            >
              Open
            </Button>
          </div>
        )}

      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm max-w-none p-4 break-words',
          'focus:outline-none focus:ring-0 focus-visible:ring-0',
          '[&>*]:focus:outline-none [&>*]:focus:ring-0 [&>*]:focus-visible:ring-0',
          '[&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus-visible:ring-0',
          'prose-headings:font-semibold prose-p:my-2',
          'prose-ul:my-2 prose-ul:list-disc prose-ul:list-outside prose-ul:ml-4',
          'prose-ol:my-2 prose-ol:list-decimal prose-ol:list-outside prose-ol:ml-4',
          'prose-li:my-1 prose-blockquote:border-l-4 prose-blockquote:border-gray-300',
          'prose-blockquote:pl-4 prose-blockquote:italic prose-code:bg-gray-100',
          'prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
          'prose-a:break-words',
          !editable && 'cursor-default',
        )}
      />
    </div>
  );
};

export default RichTextEditor;
