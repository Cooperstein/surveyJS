# SurveyJS with Go Backend

A production-ready SurveyJS application with a Go backend that provides A/B testing capabilities for different survey types.

## 🚀 Quick Start for Beginners

### What You'll Need
- **Windows 10/11** (or macOS/Linux)
- **Docker Desktop** (we'll install this)
- **Basic web browser** (Chrome, Firefox, Edge)

### Step-by-Step Setup (Windows)

#### 1. Install Docker Desktop
1. Go to [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Click "Download for Windows"
3. Run the installer and follow the prompts
4. **Restart your computer** when prompted
5. Start Docker Desktop from the Start menu
6. Wait for Docker to fully start (you'll see the whale icon in your system tray)

#### 2. Download This Project
1. Click the green "Code" button on GitHub
2. Select "Download ZIP"
3. Extract the ZIP file to a folder (e.g., `C:\Users\YourName\surveyJS`)

#### 3. Open Command Prompt
1. Press `Windows + R`
2. Type `cmd` and press Enter
3. Navigate to your project folder:
   ```cmd
   cd C:\Users\YourName\surveyJS
   ```

#### 4. Start the Application
```cmd
docker-compose up --build -d
```

#### 5. Test It Works
1. Open your web browser
2. Go to: **http://localhost:3000**
3. You should see the survey application!

## 🎯 What You'll See

- **Main Page**: SurveyJS interface with different survey types
- **Customer Feedback**: A/B testing between two feedback survey versions
- **Feature Polls**: A/B testing between two feature poll versions
- **Employee Surveys**: A/B testing between two employee survey versions

## 🆘 Troubleshooting

### "Docker is not running"
- Start Docker Desktop from the Start menu
- Wait for the whale icon to appear in your system tray
- Try the command again

### "Port 3000 is already in use"
- Stop any existing containers: `docker-compose down`
- Try again: `docker-compose up --build -d`

### "Build failed"
- Make sure Docker Desktop is fully started
- Try: `docker system prune -f` (removes old images)
- Then: `docker-compose up --build -d`

### "Can't connect to database"
- Wait for all containers to start: `docker-compose ps`
- Check logs: `docker-compose logs app`

## 📱 Testing Your App

### Health Check
- Visit: http://localhost:3000/health
- Should show: `{"service":"surveyjs-go","status":"healthy"}`

### Survey Types
- **Customer Feedback**: http://localhost:3000/feedback
- **Feature Polls**: http://localhost:3000/poll  
- **Employee Surveys**: http://localhost:3000/employee

### A/B Testing
- Refresh the same survey page multiple times
- You'll see it alternates between A and B versions
- Each user gets a consistent version for 15 minutes

## 🛠️ Useful Commands

```cmd
# Start the app
docker-compose up -d

# Stop the app
docker-compose down

# View running containers
docker-compose ps

# View app logs
docker-compose logs app

# Restart everything
docker-compose restart
```

## Features

- **A/B Testing**: Counterbalanced survey assignment for customer feedback, feature polls, and employee satisfaction surveys
- **Multi-language Support**: English, Spanish, and French survey variants
- **PostgreSQL Database**: Stores survey results and impression tracking
- **Docker Support**: Containerized application with PostgreSQL
- **Secure Cookies**: Uses secure cookies for survey assignment persistence

## Architecture

Built with Go for performance and reliability:

- **High Performance**: Go's compiled nature offers improved performance
- **Type Safety**: Strong typing reduces runtime errors
- **Concurrent Safety**: Mutex-protected counterbalancing for thread-safe A/B testing
- **Small Footprint**: Alpine-based Docker image (~15MB vs ~200MB for Node.js)

## Environment Configuration

### Local Development
For local development, the application uses hardcoded values in `docker-compose.yml`:
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=postgres`
- `POSTGRES_DB=surveydb`

### Production Deployment
For production, you'll need to set environment variables. Create a `.env` file:

```bash
# PostgreSQL Configuration
POSTGRES_USER=your_production_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=your_production_db

# Optional: Customize these for production
POSTGRES_HOST=your_db_host
POSTGRES_PORT=5432
```

**Important**: Never commit `.env` files to version control. The `.gitignore` file already excludes them.

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTGRES_HOST` | PostgreSQL server hostname | `db` (Docker) | Yes |
| `POSTGRES_USER` | Database username | `postgres` | Yes |
| `POSTGRES_PASSWORD` | Database password | `postgres` | Yes |
| `POSTGRES_DB` | Database name | `surveydb` | Yes |
| `POSTGRES_PORT` | Database port | `5432` | No |

## Quick Start

### Prerequisites
- Docker and Docker Compose

### Run with Docker
```bash
docker-compose up --build -d
```

### Access the Application
- **Health Check**: http://localhost:3000/health
- **Customer Feedback**: http://localhost:3000/feedback
- **Feature Polls**: http://localhost:3000/poll
- **Employee Surveys**: http://localhost:3000/employee

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /feedback/{lang}` - Customer feedback A/B test assignment
- `GET /poll/{lang}` - Feature poll A/B test assignment  
- `GET /employee/{lang}` - Employee satisfaction A/B test assignment
- `GET /survey/{surveyName}/{lang}` - Survey page
- `GET /api/surveys/{surveyName}/{lang}` - Survey JSON data
- `POST /api/save-survey` - Save completed survey results

## Database Schema

The application creates two tables:

- `survey_results`: Stores completed survey submissions
- `survey_impressions`: Tracks survey impressions for A/B testing

## A/B Testing Logic

Uses counterbalanced assignment to ensure equal distribution:

- **Customer Feedback**: Alternates between A and B versions
- **Feature Polls**: Alternates between A and B versions  
- **Employee Surveys**: Alternates between A and B versions

Each user gets a consistent assignment via secure cookies for 15 minutes.

## Performance Benefits

- **Faster Startup**: No runtime initialization
- **Lower Memory Usage**: Efficient memory management
- **Better Concurrency**: Native goroutine support
- **Smaller Container**: Alpine-based image (~15MB)

## Production Deployment

This application is ready for production deployment to:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- Kubernetes clusters

### Production Checklist
- [ ] Set secure database credentials
- [ ] Configure environment variables
- [ ] Set up SSL/TLS certificates
- [ ] Configure load balancer
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## License

ISC


