// Google Drive Integration for Upload Gambar Izin Siswa
import { google } from 'googleapis';
import { db } from './db';
import fs from 'fs';
import path from 'path';

// OAuth2 Configuration
const auth = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID || '',
  process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
  process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback'
);

// Store refresh token for persistent access
let refreshAccessToken: string | null = null;

// Initialize with stored credentials
async function initializeAuth() {
  try {
    // Check if we have stored credentials
    const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
    
    if (fs.existsSync(credentialsPath)) {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      auth.setCredentials({
        refresh_token: credentials.refresh_token,
        access_token: credentials.access_token,
      });
      refreshAccessToken = credentials.refresh_token;
      console.log('Google Drive credentials loaded from file');
      return true;
    }
  } catch (error) {
    console.error('Error loading Google Drive credentials:', error);
  }
  return false;
}

// Save credentials to file
async function saveCredentials(tokens: any) {
  try {
    const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
    fs.writeFileSync(credentialsPath, JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    }, null, 2));
    console.log('Google Drive credentials saved to file');
  } catch (error) {
    console.error('Error saving Google Drive credentials:', error);
  }
}

// Get authenticated drive client
async function getDriveClient() {
  // Initialize if not already done
  await initializeAuth();
  
  // Check if token is expired and refresh if needed
  if (!auth.credentials.access_token || (auth.credentials.expiry_date && Date.now() > auth.credentials.expiry_date)) {
    if (refreshAccessToken) {
      try {
        // Create new auth client with refresh token
        const newAuth = new google.auth.OAuth2(
          process.env.GOOGLE_DRIVE_CLIENT_ID || '',
          process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
          process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback'
        );
        newAuth.setCredentials({
          refresh_token: refreshAccessToken
        });
        
        const { credentials } = await newAuth.refreshAccessToken();
        auth.setCredentials(credentials);
        await saveCredentials(credentials);
        console.log('Google Drive access token refreshed');
      } catch (error) {
        console.error('Error refreshing Google Drive token:', error);
        throw new Error('Google Drive authentication failed. Please re-authenticate.');
      }
    } else {
      throw new Error('No refresh token available. Please authenticate first.');
    }
  }
  
  return google.drive({ version: 'v3', auth });
}

// Constants
const FOLDER_NAME = 'Absensi App';
const EXCUSE_FOLDER = 'Izin Siswa';

// Get or create main folder
async function getOrCreateMainFolder(): Promise<string> {
  try {
    const drive = await getDriveClient();
    
    // Search for existing folder
    const response = await drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
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
    const drive = await getDriveClient();
    const mainFolderId = await getOrCreateMainFolder();
    const studentFolderName = `Siswa_${studentId}`;

    // Search for existing student folder
    const response = await drive.files.list({
      q: `name='${studentFolderName}' and '${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
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
    console.log('Starting upload process for student:', studentId);
    const drive = await getDriveClient();
    console.log('Drive client obtained');
    
    // Get student folder
    const studentFolderId = await getOrCreateStudentFolder(studentId);
    console.log('Student folder ID:', studentFolderId);
    
    // Create unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFileName = `${reason}_${timestamp}_${fileName}`;
    console.log('Unique filename:', uniqueFileName);

    // Upload file
    console.log('Starting file upload...');
    const response = await drive.files.create({
      requestBody: {
        name: uniqueFileName,
        parents: [studentFolderId],
      },
      media: {
        mimeType,
        body: fileBuffer, // This is the correct way to pass buffer
      },
    });
    console.log('Upload response:', response.data);

    if (!response.data.id) {
      console.error('Upload failed: No file ID returned');
      return null;
    }

    // Make file publicly viewable
    console.log('Setting permissions...');
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const webViewLink = response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`;
    
    console.log(`Photo uploaded for student ${studentId}:`, uniqueFileName);
    console.log('File ID:', response.data.id);
    console.log('Web View Link:', webViewLink);
    
    return {
      fileId: response.data.id,
      webViewLink,
    };
  } catch (error: any) {
    console.error('Failed to upload to Google Drive:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      studentId,
      fileName,
      fileSize: fileBuffer.length
    });
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
    const drive = await getDriveClient();
    const studentFolderId = await getOrCreateStudentFolder(studentId);
    
    const response = await drive.files.list({
      q: `'${studentFolderId}' in parents and trashed=false`,
      fields: 'files(id, name, webViewLink, createdTime)',
      orderBy: 'createdTime desc',
    });

    return response.data.files?.map((file: any) => ({
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
    const drive = await getDriveClient();
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
  if (!process.env.GOOGLE_DRIVE_CLIENT_ID) {
    throw new Error('GOOGLE_DRIVE_CLIENT_ID not configured');
  }
  
  return auth.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appfolder',
    ],
    prompt: 'consent',
    client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_DRIVE_REDIRECT_URI,
  });
}

// Export auth for use in routes
export { auth };
