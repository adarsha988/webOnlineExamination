import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
// @ts-ignore
import NotificationService from "./services/notificationService.js";
import { setupVite, serveStatic, log } from "./vite";
import { config } from "./config/env.js";
// @ts-ignore
import connectDB from "./config/database.js";
// @ts-ignore
import { autoSeed } from "./data/seedData.js";
// @ts-ignore
import { seedMongoData } from "./data/mongoSeedData.js";
// @ts-ignore
import studentSeedData from "./data/studentSeedData.js";
// @ts-ignore
import { seedComprehensiveData } from "./data/comprehensiveSeedData.js";
// @ts-ignore
import seedStudentDashboard from "./data/seedStudents.js";

const app = express();

// CORS configuration using environment variables
app.use((req, res, next) => {
  const allowedOrigins = config.cors.allowedOrigins;
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = config.server.port;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    // Connect to MongoDB
    await connectDB();
    // Seed student dashboard data (checks if data exists first)
    await seedStudentDashboard();
    // Seed comprehensive data for full integration
    await seedComprehensiveData();
    // Seed notifications
    await NotificationService.seedNotifications();
  });
})();
