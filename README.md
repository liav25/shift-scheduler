# 🚀 Shift Scheduler Full-Stack Application

A comprehensive web application for generating fair and efficient guard schedules using an intelligent queue-based algorithm.

## ⭐ Features

- **🎯 Intelligent Scheduling**: Queue-based algorithm ensuring fair shift distribution
- **⏰ Time Validation**: Automatic validation for 30-minute intervals with helpful corrections
- **👥 Dynamic Management**: Add/remove guards and posts with intuitive interface
- **🚫 Unavailability Support**: Set complex unavailability periods for guards
- **⚙️ Flexible Configuration**: Customize shift lengths, rest periods, and constraints
- **📊 Visual Schedule Display**: Clear table view with color-coded assignments
- **📈 Real-time Analytics**: Schedule statistics and workload distribution
- **💾 Export Functionality**: Download schedules as CSV files
- **🔄 Live Connection Status**: Real-time backend connectivity monitoring

## 🛠 Technology Stack

### Backend
- **Python 3.8+** with FastAPI
- **Pydantic** for data validation
- **Uvicorn** for ASGI server
- **Custom Queue Algorithm** for fair scheduling

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for modern styling
- **Axios** for API communication
- **date-fns** for date manipulation
- **Lucide React** for beautiful icons
- **React Hot Toast** for notifications

## 🚀 Quick Start

### Option 1: One Command Setup (Recommended)

```bash
# Install root dependencies first
npm install

# Set up all environments
npm run setup

# Start both servers
npm run dev
```

This will:
- Install concurrently package for running both servers
- Install all frontend and backend dependencies
- Start the FastAPI backend on http://localhost:8000
- Start the React frontend on http://localhost:5173
- Automatically open your browser

### Option 2: Manual Setup (If Network Issues Occur)

#### Prerequisites
- **Python 3.8+** installed
- **Node.js 16+** and npm installed

#### 1. Install Dependencies Manually

```bash
# Install root dependencies first
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies (requires Python virtual environment)
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

#### 2. Start the Application

```bash
# Start both backend and frontend servers
npm run dev
```

### 🛠 Troubleshooting Network Issues

If you encounter npm network errors (like `ENOTFOUND registry.npmjs.org`):

1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

2. **Try different npm registry:**
   ```bash
   npm config set registry https://registry.npm.taobao.org/
   # Or back to default: npm config set registry https://registry.npmjs.org/
   ```

3. **Manual installation with retry:**
   ```bash
   cd frontend
   npm install --timeout=60000 --fetch-timeout=60000 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000
   cd ..
   npm run dev
   ```

4. **Reset and try again:**
   ```bash
   npm run reset  # Cleans all node_modules and starts fresh
   npm install
   npm run setup
   npm run dev
   ```

## 📖 Usage Guide

### 1. Schedule Configuration
1. **Set Time Period**: Choose start and end dates/times for your schedule
2. **Add Guards**: Use the "Add Guard" button to include all security personnel
3. **Define Posts**: Add all security posts that need coverage
4. **Set Unavailability**: Click "Add Unavailable Period" for any guard constraints
5. **Configure Shifts**: Adjust day/night shift hours and constraints
6. **Generate**: Click "Generate Schedule" to create the optimal schedule

### 2. Understanding the Algorithm

The application uses a **Queue-Based Fairness Algorithm** that:
- 🔄 Rotates guards through shifts using queues
- ⚖️ Ensures fair distribution of workload
- 🚫 Respects all unavailability constraints

- 🌙 Limits consecutive night shifts
- 📊 Optimizes for balanced assignments

### 3. Schedule Review
- **Table View**: See all assignments organized by date and time
- **Color Coding**: Night shifts (🌙) vs Day shifts (☀️)
- **Workload Stats**: Review individual guard assignments
- **Export**: Download schedule as CSV for external use

## 🔧 Development

### Backend Development
```bash
cd backend
python main.py
# Backend runs on http://localhost:8000
# API docs available at http://localhost:8000/docs
```

### Frontend Development
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Available Scripts

#### Root Level
- `npm run dev` - Start both backend and frontend
- `npm run setup` - Install all dependencies
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build

#### Frontend Only
- `npm run dev:frontend` - Start only frontend
- `npm run install:frontend` - Install frontend dependencies

#### Backend Only
- `npm run dev:backend` - Start only backend
- `npm run install:backend` - Install backend dependencies

## 📡 API Documentation

The FastAPI backend provides comprehensive API documentation:

- **Interactive Docs**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc (ReDoc)
- **Health Check**: http://localhost:8000/health

### Key Endpoints

#### POST /schedule
Generate a new schedule
```json
{
  "schedule_start_datetime": "2024-01-01T08:00:00",
  "schedule_end_datetime": "2024-01-07T08:00:00",
  "guards": ["Guard1", "Guard2", "Guard3"],
  "posts": ["Main Gate", "Parking Lot"],
  "unavailability": {},
  "shift_lengths": {
    "day_shift_hours": 8,
    "night_shift_hours": 12
  },
  "night_time_range": {
    "start": "22:00",
    "end": "06:00"
  }
}
```

#### GET /validate-time/{time_str}
Validate time format (00 or 30 minutes)

#### GET /algorithm-info
Get detailed algorithm information

## 🏗 Project Structure

```
shift-scheduler/
├── backend/
│   ├── main.py              # FastAPI application
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── SchedulerForm.tsx
│   │   │   ├── ScheduleTable.tsx
│   │   │   ├── AlgorithmInfo.tsx
│   │   │   └── ConnectionStatus.tsx
│   │   ├── services/        # API services
│   │   │   └── api.ts
│   │   ├── types/           # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx          # Main application
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.ts       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS config
│   └── tsconfig.json        # TypeScript config
├── queue_scheduler.py       # Core algorithm
├── package.json             # Root dependencies & scripts
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend
- `CORS_ORIGINS`: Allowed frontend origins (default: localhost:3000)
- `PORT`: Server port (default: 8000)

#### Frontend
- `VITE_API_URL`: Backend API URL (default: http://localhost:8000)

### Algorithm Parameters

The scheduler accepts these configuration options:
- **Shift Lengths**: Day (1-24h) and Night (1-24h) shift durations
- **Night Time Range**: When night shifts occur (e.g., 22:00 - 06:00)

- **Max Consecutive Nights**: Limit night shifts in a row (default: 1)

## 🐛 Troubleshooting

### Common Issues

#### Backend Not Starting
- Ensure Python 3.8+ is installed: `python --version`
- Check virtual environment is activated
- Install requirements: `pip install -r backend/requirements.txt`

#### Frontend Not Starting
- Ensure Node.js 16+ is installed: `node --version`
- Clear cache: `npm cache clean --force`
- Reinstall dependencies: `rm -rf frontend/node_modules && npm run install:frontend`

#### Connection Issues
- Check both servers are running
- Verify ports 3000 and 8000 are available
- Check firewall settings
- Look for CORS errors in browser console

#### Schedule Generation Fails
- Ensure sufficient guards for the time period
- Check unavailability doesn't exclude all guards
- Try reducing schedule complexity
- Review algorithm constraints

### Performance Tips

- **Large Schedules**: For 50+ guards or month-long schedules, generation may take 10-30 seconds
- **Memory Usage**: Complex schedules use more memory; close other applications if needed
- **Browser Performance**: Use Chrome or Firefox for best performance

## 🚀 Deployment

### Frontend Deployment
Deploy to Vercel, Netlify, or any static hosting:
```bash
cd frontend
npm run build
# Upload dist/ folder to your hosting provider
```

### Backend Deployment
Deploy to Heroku, DigitalOcean, or any cloud provider:
```bash
cd backend
# Add to requirements.txt if needed
pip freeze > requirements.txt
# Deploy using your platform's instructions
```

### Docker Support (Optional)
```dockerfile
# Backend Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "backend/main.py"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README and API docs at `/docs`
- **Issues**: Report bugs via GitHub Issues
- **Questions**: Use GitHub Discussions for questions
- **Development**: Check the project wiki for development guidelines

---

**Built with ❤️ using modern web technologies for efficient shift scheduling.** 