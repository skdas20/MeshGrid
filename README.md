# Line Game Frontend

Frontend for the Line Game multiplayer application with AI opponent.

## Deployment

This frontend is configured to be deployed on Vercel and connect to a backend server.

### Setup Instructions

1. Make sure your backend is deployed at: 
   **https://web-production-f35ee.up.railway.app**

2. Update the Socket.IO connection to use your backend URL:
   ```
   npm run update-backend
   ```
   
   Or specify a custom URL:
   ```
   node update-backend-url.js https://your-custom-backend-url.com
   ```

3. Deploy to Vercel:
   - Connect your GitHub repository to Vercel
   - Set the output directory to `public`
   - Deploy the project

### Features

- Beautiful UI with custom animations
- Loading screen with video background
- Sound effects for game actions
- Real-time multiplayer functionality
- Play against an AI powered by reinforcement learning
- Rotating 3D hash symbol for visual appeal

## Development

To run locally:
```
npm install
npm run dev
```

Make sure your backend server is also running locally or update the Socket.IO connection to point to your deployed backend. 