// Google Drive Integration for Upload Gambar Izin Siswa
import { google } from 'googleapis';
import { db } from './db';

// OAuth2 Configuration
const auth = new google.auth.OAuth2Client({
  clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
});

const drive = google.drive({ version: 'v3', auth });

// Constants
const FOLDER_NAME = 'Absensi App';
const EXCUSE_FOLDER = 'Izin Siswa';

// Get or create main folder
async function getOrCreateMainFolder(): Promise<string> {
  try {
    // Search for existing folder
    const response = await drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (response.data.files?.length > 0) {
      return response.data.files[0].id!;
    }

    // Create new folder if not exists
    const createResponse = await drive.files.create({
      requestBody: {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      },
    });

    return createResponse.data.id!;
  } catch (error) {
    console.error('Error getting/creating main folder:', error);
    throw error;
  }
}

// Get or create student excuse folder
async function getOrCreateStudentFolder(studentId: number): Promise<string> {
  try {
    const mainFolderId = await getOrCreateMainFolder();
    const studentFolderName = `Siswa_${studentId}`;

    // Search for existing student folder
    const response = await drive.files.list({
      q: `name='${studentFolderName}' and '${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (response.data.files?.length > 0) {
      return response.data.files[0].id!;
    }

    // Create new student folder
    const createResponse = await drive.files.create({
      requestBody: {
        name: studentFolderName,
        parents: [mainFolderId],
        mimeType: 'application/vnd.google-apps.folder',
      },
    });

    return createResponse.data.id!;
  } catch (error) {
    console.error('Error getting/creating student folder:', error);
    throw error;
  }
}

// Upload excuse photo to Google Drive
export async function uploadExcusePhoto(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  studentId: number,
  reason: string,
  date: string
): Promise<{ fileId: string; webViewLink: string } | null> {
  try {
    // Get student folder
    const studentFolderId = await getOrCreateStudentFolder(studentId);
    
    // Create unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFileName = `${reason}_${timestamp}_${fileName}`;

    // Upload file
    const response = await drive.files.create({
      requestBody: {
        name: uniqueFileName,
        parents: [studentFolderId],
      },
      media: {
        mimeType,
        body: fileBuffer,
      },
    });

    if (!response.data.id) {
      console.error('Upload failed: No file ID returned');
      return null;
    }

    // Make file publicly viewable
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const webViewLink = response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`;
    
    console.log(`Photo uploaded for student ${studentId}:`, uniqueFileName);
    
    return {
      fileId: response.data.id,
      webViewLink,
    };
  } catch (error) {
    console.error('Failed to upload to Google Drive:', error);
    return null;
  }
}

// Get all photos for a student
export async function getStudentPhotos(studentId: number): Promise<Array<{
  id: string;
  webViewLink: string;
  fileName: string;
  uploadDate: string;
  reason: string;
}>> {
  try {
    const studentFolderId = await getOrCreateStudentFolder(studentId);
    
    const response = await drive.files.list({
      q: `'${studentFolderId}' in parents and trashed=false`,
      fields: 'files(id, name, webViewLink, createdTime)',
      orderBy: 'createdTime desc',
    });

    return response.data.files?.map(file => ({
      id: file.id!,
      webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      fileName: file.name!,
      uploadDate: file.createdTime!,
      reason: file.name?.split('_')[0] || 'Unknown',
    })) || [];
  } catch (error) {
    console.error('Failed to get student photos:', error);
    return [];
  }
}

// Delete photo from Google Drive
export async function deletePhoto(fileId: string): Promise<boolean> {
  try {
    await drive.files.delete({
      fileId,
    });
    return true;
  } catch (error) {
    console.error('Failed to delete photo:', error);
    return false;
  }
}

// Generate OAuth URL for frontend
export function getAuthUrl(): string {
  return auth.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appfolder',
    ],
    prompt: 'consent',
  });
}
