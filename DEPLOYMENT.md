# Deployment Guide

This guide covers deploying the Online Examination System to various platforms.

## 🔧 Pre-deployment Checklist

### 1. Environment Variables Setup
- ✅ `.env.example` created with all required variables
- ✅ `.env.local` created for local development
- ✅ Sensitive data moved to environment variables
- ✅ `.gitignore` updated to exclude environment files

### 2. Security Configuration
- ✅ JWT secrets properly configured
- ✅ Database URLs externalized
- ✅ bcrypt salt rounds configurable
- ✅ CORS origins configurable
- ✅ Rate limiting implemented

## 🚀 Deployment Options

### Option 1: Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   # Install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-app-name
   heroku addons:create mongolab:sandbox
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-production-jwt-secret
   heroku config:set DATABASE_URL=your-mongodb-atlas-url
   heroku config:set CLIENT_URL=https://your-app-name.herokuapp.com
   heroku config:set OPENAI_API_KEY=your-openai-key
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 2: Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard**
   - Go to your project settings
   - Add all variables from `.env.example`

### Option 3: Railway Deployment

1. **Connect GitHub Repository**
   - Go to railway.app
   - Connect your GitHub repository

2. **Set Environment Variables**
   - Add all variables from `.env.example`
   - Railway will auto-deploy on push

### Option 4: DigitalOcean App Platform

1. **Create App**
   - Connect GitHub repository
   - Choose Node.js environment

2. **Configure Build Settings**
   ```yaml
   # app.yaml
   name: online-examination-system
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/your-repo
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: JWT_SECRET
       value: your-jwt-secret
       type: SECRET
     - key: DATABASE_URL
       value: your-database-url
       type: SECRET
   ```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create Cluster**
   - Go to mongodb.com/atlas
   - Create free cluster
   - Create database user
   - Whitelist IP addresses

2. **Get Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/online_examination
   ```

### Local MongoDB
```bash
# Install MongoDB locally
# macOS
brew install mongodb-community

# Ubuntu
sudo apt install mongodb

# Start MongoDB
mongod --dbpath /path/to/data/directory
```

## 🔐 Security Best Practices

### Production Environment Variables
```env
# Required for production
NODE_ENV=production
JWT_SECRET=super-secure-random-string-min-32-chars
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/db

# Recommended for production
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000

# Optional but recommended
OPENAI_API_KEY=sk-your-openai-key
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
```

### JWT Secret Generation
```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📊 Monitoring & Logging

### Error Tracking (Sentry)
```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Application Monitoring
```env
LOG_LEVEL=info
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "your-app-name"
        heroku_email: "your-email@domain.com"
```

## 🧪 Testing Before Deployment

### Local Production Test
```bash
# Set production environment
export NODE_ENV=production

# Build and start
npm run build
npm start
```

### Health Check Endpoints
- `GET /health` - Basic health check
- `GET /api/stats/overview` - API functionality check

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   ```bash
   # Check if dotenv is installed
   npm list dotenv
   
   # Install if missing
   npm install dotenv
   ```

2. **Database Connection Issues**
   ```bash
   # Test MongoDB connection
   mongosh "your-connection-string"
   ```

3. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

4. **CORS Issues**
   ```env
   # Update allowed origins
   ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
   ```

## 📈 Performance Optimization

### Production Optimizations
- Enable gzip compression
- Use CDN for static assets
- Implement Redis caching
- Database indexing
- Image optimization

### Environment Variables for Performance
```env
# Enable compression
ENABLE_COMPRESSION=true

# Redis caching
REDIS_URL=redis://localhost:6379

# File upload limits
MAX_FILE_SIZE=10485760
```

## 🔒 SSL/HTTPS Setup

### Let's Encrypt (Free SSL)
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot --nginx -d your-domain.com
```

### Cloudflare (Recommended)
- Add your domain to Cloudflare
- Enable SSL/TLS encryption
- Configure DNS records

## 📝 Post-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Database connection working
- [ ] Authentication system functional
- [ ] Admin dashboard accessible
- [ ] Email notifications working (if configured)
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Error monitoring setup
- [ ] Backup strategy implemented
- [ ] Performance monitoring active

## 🆘 Support

If you encounter issues during deployment:

1. Check the application logs
2. Verify environment variables
3. Test database connectivity
4. Review security settings
5. Check network configuration

For additional help, refer to the main README.md or create an issue on GitHub.
