import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { FileUploadResult, FileParseError, SupportedFileType } from '../types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const MAX_ROWS = 100000; // Row limit for performance

export function getFileType(file: File): SupportedFileType | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') return 'csv';
  if (extension === 'json') return 'json';
  if (extension === 'xlsx') return 'xlsx';
  if (extension === 'xls') return 'xls';
  return null;
}

export async function parseFile(file: File): Promise<FileUploadResult | FileParseError> {
  // Size check
  if (file.size > MAX_FILE_SIZE) {
    return {
      type: 'TOO_LARGE',
      message: 'File too large',
      details: `Maximum file size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`
    };
  }

  const fileType = getFileType(file);

  if (!fileType) {
    return {
      type: 'INVALID_FORMAT',
      message: 'Unsupported file format',
      details: 'Please upload a CSV, JSON, or Excel (.xlsx, .xls) file.'
    };
  }

  try {
    switch (fileType) {
      case 'csv':
        return await parseCSV(file);
      case 'json':
        return await parseJSON(file);
      case 'xlsx':
      case 'xls':
        return await parseExcel(file);
    }
  } catch (error) {
    return {
      type: 'PARSE_ERROR',
      message: 'Failed to parse file',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function parseCSV(file: File): Promise<FileUploadResult | FileParseError> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      preview: MAX_ROWS,
      complete: (results) => {
        if (results.errors.length > 0) {
          resolve({
            type: 'PARSE_ERROR',
            message: 'CSV parsing error',
            details: results.errors[0].message
          });
          return;
        }

        const data = results.data as Record<string, unknown>[];

        if (data.length === 0) {
          resolve({
            type: 'EMPTY_FILE',
            message: 'File is empty',
            details: 'The uploaded file contains no data rows.'
          });
          return;
        }

        resolve({
          data,
          fileName: file.name,
          rowCount: data.length,
          fieldCount: Object.keys(data[0] || {}).length
        });
      },
      error: (error) => {
        resolve({
          type: 'PARSE_ERROR',
          message: 'CSV parsing failed',
          details: error.message
        });
      }
    });
  });
}

async function parseJSON(file: File): Promise<FileUploadResult | FileParseError> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      type: 'PARSE_ERROR',
      message: 'Invalid JSON',
      details: 'The file contains malformed JSON.'
    };
  }

  // Validate it's an array
  if (!Array.isArray(parsed)) {
    return {
      type: 'INVALID_FORMAT',
      message: 'Invalid data format',
      details: 'JSON file must contain an array of objects.'
    };
  }

  if (parsed.length === 0) {
    return {
      type: 'EMPTY_FILE',
      message: 'File is empty',
      details: 'The JSON array contains no objects.'
    };
  }

  // Validate first item is an object
  if (typeof parsed[0] !== 'object' || parsed[0] === null) {
    return {
      type: 'INVALID_FORMAT',
      message: 'Invalid data format',
      details: 'JSON array must contain objects with named fields.'
    };
  }

  const data = parsed.slice(0, MAX_ROWS) as Record<string, unknown>[];

  return {
    data,
    fileName: file.name,
    rowCount: data.length,
    fieldCount: Object.keys(data[0] || {}).length
  };
}

async function parseExcel(file: File): Promise<FileUploadResult | FileParseError> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Use first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      type: 'EMPTY_FILE',
      message: 'Empty workbook',
      details: 'The Excel file contains no sheets.'
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
    raw: false // Parse dates as strings
  }) as Record<string, unknown>[];

  if (data.length === 0) {
    return {
      type: 'EMPTY_FILE',
      message: 'Sheet is empty',
      details: 'The first sheet contains no data.'
    };
  }

  return {
    data: data.slice(0, MAX_ROWS),
    fileName: file.name,
    rowCount: Math.min(data.length, MAX_ROWS),
    fieldCount: Object.keys(data[0] || {}).length
  };
}

export function isParseError(result: FileUploadResult | FileParseError): result is FileParseError {
  return 'type' in result && ['PARSE_ERROR', 'INVALID_FORMAT', 'EMPTY_FILE', 'TOO_LARGE'].includes(result.type);
}
