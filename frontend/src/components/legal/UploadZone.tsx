'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { simulateOCRExtraction } from '@/hooks/useLegalData'

interface UploadZoneProps {
  onOCRComplete: (result: ReturnType<typeof simulateOCRExtraction>) => void
  disabled?: boolean
}

export function UploadZone({ onOCRComplete, disabled = false }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true)

      // Simulate file reading
      const text = await file.text()

      // Simulate OCR processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Get OCR result (this would normally call OpenAI Vision, AWS Textract, etc.)
      const result = simulateOCRExtraction(text)
      onOCRComplete(result)
    } catch (err) {
      console.error('File processing error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        processFile(file)
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  return (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed cursor-pointer transition-colors ${
        isDragging ? 'border-brand-cornflower bg-brand-cornflower/5' : 'border-gray-300'
      } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <CardContent className='pt-8 pb-8'>
        <div className='flex flex-col items-center justify-center text-center'>
          {isProcessing ? (
            <>
              <Icons.loader className='h-12 w-12 animate-spin text-brand-cornflower mb-3' />
              <h3 className='font-semibold text-brand-navy mb-1'>Processing Document</h3>
              <p className='text-sm text-brand-muted'>Running OCR extraction...</p>
            </>
          ) : (
            <>
              <Icons.upload className='h-12 w-12 text-gray-300 mb-3' />
              <h3 className='font-semibold text-brand-navy mb-1'>Upload Signed Contract</h3>
              <p className='text-sm text-brand-muted mb-4'>
                Drag and drop a PDF file or click to select
              </p>
              <input
                type='file'
                accept='.pdf,application/pdf'
                onChange={handleFileInput}
                disabled={disabled || isProcessing}
                className='hidden'
                id='pdf-upload'
              />
              <Button
                onClick={() => document.getElementById('pdf-upload')?.click()}
                disabled={disabled || isProcessing}
              >
                <Icons.upload className='h-4 w-4 mr-2' />
                Choose PDF
              </Button>
              <p className='text-xs text-brand-muted mt-3'>
                Supported format: PDF (Max 10MB)
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
