import { useEffect, useRef } from 'react'
import Quill from 'quill'
import { cn } from '@/lib/utils'

const FONT_WHITELIST = ['sans-serif', 'serif', 'monospace']
const SIZE_WHITELIST = ['12px', '14px', '16px', '18px', '24px', '32px']

let registered = false

function registerQuillFormats() {
  if (registered) return

  const FontStyle = Quill.import('attributors/style/font')
  FontStyle.whitelist = FONT_WHITELIST
  Quill.register(FontStyle, true)

  const SizeStyle = Quill.import('attributors/style/size')
  SizeStyle.whitelist = SIZE_WHITELIST
  Quill.register(SizeStyle, true)

  registered = true
}

function normalizeHtml(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  return text
}

function looksLikeHtml(value) {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ''))
}

export default function RichTextEditor({ value, onChange, placeholder, className }) {
  const editorElementRef = useRef(null)
  const toolbarElementRef = useRef(null)
  const quillRef = useRef(null)

  useEffect(() => {
    registerQuillFormats()
    if (!editorElementRef.current || !toolbarElementRef.current || quillRef.current) return

    const quill = new Quill(editorElementRef.current, {
      theme: 'snow',
      placeholder: placeholder || 'Nhập nội dung...',
      modules: {
        toolbar: {
          container: toolbarElementRef.current,
        },
      },
      formats: [
        'header',
        'font',
        'size',
        'bold',
        'italic',
        'underline',
        'strike',
        'color',
        'background',
        'align',
        'list',
        'bullet',
        'indent',
      ],
    })

    quillRef.current = quill

    const initialValue = normalizeHtml(value)
    if (initialValue) {
      if (looksLikeHtml(initialValue)) quill.clipboard.dangerouslyPasteHTML(initialValue)
      else quill.setText(initialValue)
    }

    quill.on('text-change', () => {
      const isEmpty = quill.getText().trim().length === 0
      onChange?.(isEmpty ? '' : quill.root.innerHTML)
    })
  }, [onChange, placeholder, value])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return

    const incoming = normalizeHtml(value)
    const current = normalizeHtml(quill.root.innerHTML)
    if (incoming === current) return

    const selection = quill.getSelection()
    if (!incoming) {
      quill.setText('')
    } else if (looksLikeHtml(incoming)) {
      quill.clipboard.dangerouslyPasteHTML(incoming)
    } else {
      quill.setText(incoming)
    }
    if (selection) quill.setSelection(selection)
  }, [value])

  return (
    <div className={cn('overflow-hidden rounded-md border bg-background', className)}>
      <div ref={toolbarElementRef} className="border-b bg-muted/30">
        <span className="ql-formats">
          <select className="ql-font" defaultValue="sans-serif">
            {FONT_WHITELIST.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
          <select className="ql-size" defaultValue="16px">
            {SIZE_WHITELIST.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <select className="ql-header" defaultValue="">
            <option value="">Normal</option>
            <option value="2">Heading</option>
            <option value="3">Subheading</option>
          </select>
        </span>
        <span className="ql-formats">
          <button className="ql-bold" aria-label="Bold" />
          <button className="ql-italic" aria-label="Italic" />
          <button className="ql-underline" aria-label="Underline" />
          <button className="ql-strike" aria-label="Strike" />
        </span>
        <span className="ql-formats">
          <select className="ql-color" />
          <select className="ql-background" />
          <select className="ql-align" />
        </span>
        <span className="ql-formats">
          <button className="ql-list" value="ordered" aria-label="Ordered list" />
          <button className="ql-list" value="bullet" aria-label="Bullet list" />
          <button className="ql-indent" value="-1" aria-label="Decrease indent" />
          <button className="ql-indent" value="+1" aria-label="Increase indent" />
        </span>
        <span className="ql-formats">
          <button className="ql-clean" aria-label="Clear formatting" />
        </span>
      </div>

      <div ref={editorElementRef} className="min-h-72 text-sm" />
    </div>
  )
}
