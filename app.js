/**
 * Swiftboost Cloud - Main Application Server
 * Express.js setup with middleware, routes, Supabase integration, and theme configuration
 * Created: 2025-12-07
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== SUPABASE CONFIGURATION ====================
/**
 * Initialize Supabase client
 * Requires SUPABASE_URL and SUPABASE_KEY in environment variables
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: Supabase credentials not configured. Some features may be unavailable.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// ==================== THEME CONFIGURATION ====================
/**
 * Theme configuration object
 * Supports light and dark modes with customizable colors
 */
const themeConfig = {
  light: {
    name: 'light',
    primary: '#3B82F6',
    secondary: '#1F2937',
    accent: '#10B981',
    background: '#FFFFFF',
    surface: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
  },
  dark: {
    name: 'dark',
    primary: '#60A5FA',
    secondary: '#F3F4F6',
    accent: '#34D399',
    background: '#111827',
    surface: '#1F2937',
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    border: '#374151',
    error: '#F87171',
    warning: '#FBBF24',
    success: '#6EE7B7',
  },
};

// ==================== MIDDLEWARE SETUP ====================

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Request ID middleware
app.use((req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Custom error handling middleware
app.use((req, res, next) => {
  res.locals.supabase = supabase;
  res.locals.theme = themeConfig;
  next();
});

// ==================== AUTHENTICATION MIDDLEWARE ====================

/**
 * Verify JWT token from Supabase
 * Adds user to req.user if token is valid
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    next();
  }
};

app.use(verifyToken);

/**
 * Require authentication middleware
 * Use this on protected routes
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'Unauthorized',
    });
  }
  next();
};

// ==================== API ROUTES ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    supabase: !!supabaseUrl && !!supabaseKey,
  });
});

// Theme endpoint
app.get('/api/theme/:mode?', (req, res) => {
  const mode = req.params.mode || 'light';
  const theme = themeConfig[mode];

  if (!theme) {
    return res.status(400).json({
      success: false,
      message: 'Invalid theme mode',
      available: Object.keys(themeConfig),
    });
  }

  res.json({
    success: true,
    theme,
    allThemes: Object.keys(themeConfig),
  });
});

// Get all available themes
app.get('/api/themes', (req, res) => {
  res.json({
    success: true,
    themes: themeConfig,
  });
});

// ==================== AUTHENTICATION ROUTES ====================

/**
 * Register new user
 * POST /api/auth/register
 * Body: { email, password, metadata?: {} }
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, metadata } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const { data, error } = await supabase.auth.signUpWithPassword({
      email,
      password,
      options: {
        data: metadata || {},
      },
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Registration failed',
        error: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: data.user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
});

/**
 * Login user
 * POST /api/auth/login
 * Body: { email, password }
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: 'Login failed',
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
});

/**
 * Logout user
 * POST /api/auth/logout
 */
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Logout failed',
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message,
    });
  }
});

/**
 * Get current user
 * GET /api/auth/user
 */
app.get('/api/auth/user', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * Refresh session
 * POST /api/auth/refresh
 */
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return res.status(401).json({
        success: false,
        message: 'Token refresh failed',
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Session refreshed',
      session: data.session,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh',
      error: error.message,
    });
  }
});

// ==================== USER PROFILE ROUTES ====================

/**
 * Get user profile
 * GET /api/users/profile
 */
app.get('/api/users/profile', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      success: true,
      profile: data || null,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
});

/**
 * Update user profile
 * PUT /api/users/profile
 * Body: { username?, full_name?, avatar_url?, bio?, theme_preference? }
 */
app.put('/api/users/profile', requireAuth, async (req, res) => {
  try {
    const { username, full_name, avatar_url, bio, theme_preference } = req.body;

    const updateData = {
      id: req.user.id,
      updated_at: new Date().toISOString(),
    };

    if (username !== undefined) updateData.username = username;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (bio !== undefined) updateData.bio = bio;
    if (theme_preference !== undefined) updateData.theme_preference = theme_preference;

    const { data, error } = await supabase
      .from('profiles')
      .upsert([updateData])
      .select();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: data[0],
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
});

// ==================== GENERIC DATA ROUTES ====================

/**
 * Get data from a table
 * GET /api/data/:table
 * Query params: ?limit=10&offset=0&order=id&ascending=true
 */
app.get('/api/data/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { limit = 10, offset = 0, order = 'created_at', ascending = false } = req.query;

    let query = supabase.from(table).select('*');

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    if (offset) {
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    }

    if (order) {
      query = query.order(order, { ascending: ascending === 'true' });
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data,
      count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Data fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data',
      error: error.message,
    });
  }
});

/**
 * Insert data into a table
 * POST /api/data/:table
 * Body: { ...data }
 */
app.post('/api/data/:table', requireAuth, async (req, res) => {
  try {
    const { table } = req.params;
    const insertData = {
      ...req.body,
      user_id: req.user.id,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(table)
      .insert([insertData])
      .select();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Data created successfully',
      data: data[0],
    });
  } catch (error) {
    console.error('Data insert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create data',
      error: error.message,
    });
  }
});

/**
 * Update data in a table
 * PUT /api/data/:table/:id
 * Body: { ...updatedData }
 */
app.put('/api/data/:table/:id', requireAuth, async (req, res) => {
  try {
    const { table, id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Data updated successfully',
      data: data[0],
    });
  } catch (error) {
    console.error('Data update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update data',
      error: error.message,
    });
  }
});

/**
 * Delete data from a table
 * DELETE /api/data/:table/:id
 */
app.delete('/api/data/:table/:id', requireAuth, async (req, res) => {
  try {
    const { table, id } = req.params;

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Data deleted successfully',
    });
  } catch (error) {
    console.error('Data delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete data',
      error: error.message,
    });
  }
});

// ==================== 404 AND ERROR HANDLING ====================

/**
 * 404 Not Found handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
  });
});

/**
 * Global error handler
 */
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: error.stack }),
  });
});

// ==================== SERVER STARTUP ====================

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           Swiftboost Cloud Server Started                  ║
╚════════════════════════════════════════════════════════════╝
✓ Environment: ${NODE_ENV}
✓ Port: ${PORT}
✓ Supabase: ${supabaseUrl ? '✓ Configured' : '✗ Not configured'}
✓ API Documentation:
  - Health Check: http://localhost:${PORT}/health
  - API Base: http://localhost:${PORT}/api
  - Themes: http://localhost:${PORT}/api/themes
  - Auth: http://localhost:${PORT}/api/auth/*
  - Users: http://localhost:${PORT}/api/users/*
  - Data: http://localhost:${PORT}/api/data/:table
────────────────────────────────────────────────────────────
Timestamp: ${new Date().toISOString()}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// ==================== EXPORTS ====================

module.exports = app;
module.exports.supabase = supabase;
module.exports.themeConfig = themeConfig;
