# Video Processing & Streaming Application

A comprehensive full-stack application for video uploading, sensitivity processing, and streaming with real-time updates.

## Features

- **User Authentication**: Secure Login and Registration with JWT and Role-Based Access Control (Viewer, Editor, Admin).
- **Video Management**: Upload videos (Editor/Admin), view list of videos.
- **Sensitivity Analysis**: Automated mock processing to flag videos as 'safe' or 'flagged'.
- **Real-Time Updates**: Live status updates using Socket.io.
- **Video Streaming**: HTTP Range request based streaming for smooth playback.
- **Multi-Tenancy**: Users can only see their own videos (Admins can see all).

## Tech Stack

### Backend
- **Node.js** & **Express.js**: RESTful API and static file serving.
- **MongoDB** & **Mongoose**: Database for storing user and video metadata.
- **Socket.io**: Real-time bidirectional event-based communication.
- **Multer**: Middleware for handling `multipart/form-data` (file uploads).
- **JWT**: JSON Web Tokens for secure authentication.

### Frontend
- **React**: UI library.
- **Vite**: Build tool.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Socket.io Client**: For connecting to the backend socket server.
- **React Router**: For client-side routing.
- **React Toastify**: For notifications.

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas URI or Local MongoDB

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Pulse
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    ```
    - Create a `.env` file in the `backend` directory:
      ```env
      MONGODB_URI=mongodb+srv://srinutirumanisetti:pavan14112002@cluster0.3lpscsi.mongodb.net/?appName=Cluster0
      PORT=5000
      JWT_SECRET=your_super_secret_key
      ```
    - Start the server:
      ```bash
      npm run dev
      ```

3.  **Frontend Setup:**
    ```bash
    cd ../frontend
    npm install
    ```
    - Create a `.env` file in the `frontend` directory:
      ```env
      VITE_API_URL=http://localhost:5000/api
      ```
    - Start the development server:
      ```bash
      npm run dev
      ```

## Usage

1.  Open the frontend URL (usually `http://localhost:5173`).
2.  Register a new account (Default role is 'Viewer', select 'Editor' or 'Admin' to upload).
3.  **Upload**: Go to Dashboard and upload a video file.
4.  **Processing**: Watch the status update in real-time from 'processing' to 'safe' or 'flagged'.
5.  **Streaming**: Click on a 'safe' video to play it.

## API Endpoints

- `POST /api/auth/register`: Register new user.
- `POST /api/auth/login`: Login user.
- `POST /api/videos/upload`: Upload video (Protected, Editor/Admin).
- `GET /api/videos`: Get all videos for user (Protected).
- `GET /api/videos/:id`: Get specific video details.
- `GET /api/videos/stream/:id`: Stream video content.

## Design Decisions

- **Separation of Concerns**: Backend handles logic/storage, Frontend handles UI/Display.
- **Socket.io**: Chosen for real-time feedback which is better UX than polling.
- **Range Requests**: Essential for video streaming to allow seeking and efficient data transfer.
- **JWT**: Stateless authentication suitable for scalable REST APIs.
