import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import cors from 'cors';
import hbs from 'hbs';
import path from 'path';
import url from 'url';
import session from 'express-session';
import passport from 'passport';
import { Strategy } from 'passport-local';

// Import all modules for Dependency Injection:
import siteInit from './web/site/foccacia-web-site.mjs';
import groupsApiInit from './web/api/groups-web-api.mjs';
import usersApiInit from './web/api/users-web-api.mjs';
import competitionsApiInit from './web/api/competitions-web-api.mjs';

import groupsServicesInit from './services/groups-services.mjs';
import usersServicesInit from './services/users-services.mjs';
import competitionsServicesInit from './services/competitions-services.mjs';

// Data layer imports
import usersDataElasticInit from './data/elastic/users-data-elastic.mjs';
import foccaciaDataElasticInit from './data/elastic/foccacia-data-elastic.mjs';

import fapiTeamsDataInit from './data/mem/fapi-teams-data.mjs';
import mockFapiTeamsDataInit from './data/mock/mock-fapi-teams-data.mjs';

const PORT = 3000;
// SET TO TRUE to use mock data (no API key needed), FALSE to use real Football Data API
const USE_MOCK_DATA = false;
// When using mock data, the competitions service still expects a non-empty apiKey.
// Provide a harmless default so the UI dropdown can be populated without env setup.
const FOOTBALL_API_KEY = USE_MOCK_DATA
  ? (process.env.KEY ?? process.env.API_KEY ?? process.env.FOOTBALL_API_KEY ?? 'MOCK')
  : (process.env.KEY ?? process.env.API_KEY ?? process.env.FOOTBALL_API_KEY);

if (!USE_MOCK_DATA && !FOOTBALL_API_KEY) {
  console.error('[CONFIG] Missing Football API key. Set KEY (or FOOTBALL_API_KEY) in .env; add-player will fail without it.');
}

const CURRENT_DIR = url.fileURLToPath(new URL('.', import.meta.url));
const PATH_PUBLIC = path.join(CURRENT_DIR, 'web', 'site', 'public');
const PATH_VIEWS = path.join(CURRENT_DIR, 'web', 'site', 'views');
const PATH_PARTIALS = path.join(PATH_VIEWS, 'partials');

let groupsServices, usersServices, competitionsServices;
let groupsAPI, usersAPI, competitionsAPI, site;

// Dependency Injection:
try {
  const ELASTIC_URL = process.env.ELASTIC_URL;
  // Data layer initialization
  const usersData = usersDataElasticInit(ELASTIC_URL, fetch);

  const foccaciaData = foccaciaDataElasticInit(ELASTIC_URL, fetch);

  const fapiTeamsData = USE_MOCK_DATA
    ? mockFapiTeamsDataInit()
    : (fapiTeamsDataInit?.() ?? fapiTeamsDataInit);
  
  // Services layer initialization
  usersServices = usersServicesInit(usersData);
  competitionsServices = competitionsServicesInit(fapiTeamsData);
  groupsServices = groupsServicesInit(foccaciaData, usersServices, competitionsServices);

  // Web controllers initialization
  groupsAPI = groupsApiInit(groupsServices);
  usersAPI = usersApiInit(usersServices);
  competitionsAPI = competitionsApiInit(competitionsServices);
  site = siteInit(groupsServices, competitionsServices, FOOTBALL_API_KEY);
}
catch (err) {
  console.error('Error during dependency injection:', err);
}

if (groupsAPI && usersAPI && competitionsAPI && site) {
  const app = express();
  
  // Parser the body to JSON
  app.use(express.json());

  // Parser the body to URL-encoded (forms in HTML)
  app.use(express.urlencoded({ extended: true }));
  
  // Serves static files (CSS, JS, images...)
  app.use(express.static(PATH_PUBLIC));

  // 1. Configur session
  app.use(session({
    secret: 'ipw-isel-foccacia-secret', 
    resave: false,
    saveUninitialized: false
  }));

  // 2. Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  /**
   * Express middleware that ensures the current request is authenticated.
   * If the user is not authenticated, it redirects to the login page.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   * @returns {void}
   */
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/site/login');
  }

  /**
   * Passport Local Strategy callback.
   * Authenticates (or creates) a user using the configured users service.
   */
  passport.use(new Strategy(async (username, password, done) => {
    try {
      const user = await usersServices.getOrCreateUser(username, password);
      if (user) {
        return done(null, user);
      }
      // Invalid credentials
      return done(null, false, { message: 'Incorreto' });
    } catch (err) {
      console.error('Authentication error:', err);
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => {
    if (user?.username) {
      return done(null, user.username);
    }
    return done(new Error('Invalid user object or missing username'));
  });

  // Restore the full user from the username stored in session
  passport.deserializeUser(async (username, done) => {
    try {
      const user = await usersServices.getUserByUsername(username);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });
  
  // View path
  app.set('views', PATH_VIEWS);

  // View engine
  app.set('view engine', 'hbs');
  
  // Handlebars partials
  hbs.registerPartials(PATH_PARTIALS);
  
  // Register Handlebars helpers
  hbs.registerHelper('eq', (a, b) => a === b);
  hbs.registerHelper('neq', (a, b) => a != b);
  hbs.registerHelper('lt', (a, b) => a < b);
  hbs.registerHelper('lte', (a, b) => a <= b);
  hbs.registerHelper('gt', (a, b) => a > b);
  hbs.registerHelper('gte', (a, b) => a >= b);
  
  app.use((req, res, next) => {
    // res.locals define variáveis que ficam disponíveis em todos os templates .hbs
    res.locals.user = req.user; 
    next();
  });
  
  /**
   * GET /site
   * Renders the application's home page.
   *
   * @route GET /site
   * @returns {void}
   */
  app.get('/site', site.getHome);

  /**
   * GET /site/login
   * Renders the login form.
   *
   * @route GET /site/login
   * @returns {void}
   */
  app.get('/site/login', (req, res) => {
    res.render('login', { title: 'Login' });
  });

  /**
   * POST /site/login
   * Authenticates the user using Passport Local Strategy.
   *
   * @route POST /site/login
   * @returns {void}
   */
  app.post('/site/login', passport.authenticate('local', {
    successRedirect: '/site/groups',
    failureRedirect: '/site/login',
  }));

  /**
   * POST /site/logout
   * Logs out the current user and redirects to the site home.
   *
   * @route POST /site/logout
   * @returns {void}
   */
  app.post('/site/logout', (req, res) => {
    req.logout(() => res.redirect('/site'));
  });


  // Swagger UI for API documentation
  const swaggerDocument = yaml.load('./docs/foccacia-api-spec.yaml');
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


  // Enable CORS for API routes
  app.use('/api', cors());


  // ============= WEB SITE ROUTES (HTML) =============

  /**
   * GET /site/groups
   * Renders the groups list page (requires authentication).
   *
   * @route GET /site/groups
   * @returns {void}
   */
  app.get('/site/groups', ensureAuthenticated, site.getGroups);

  /**
   * GET /site/groups/new
   * Renders the group creation form (requires authentication).
   *
   * @route GET /site/groups/new
   * @returns {void}
   */
  app.get('/site/groups/new', ensureAuthenticated, site.getCreateGroupForm);

  /**
   * POST /site/groups/new
   * Creates a new group (requires authentication).
   *
   * @route POST /site/groups/new
   * @returns {void}
   */
  app.post('/site/groups/new', ensureAuthenticated, site.createGroup);

  /**
   * GET /site/groups/:groupId/update
   * Renders the group update form (requires authentication).
   *
   * @route GET /site/groups/:groupId/update
   * @returns {void}
   */
  app.get('/site/groups/:groupId/update', ensureAuthenticated, site.getUpdateGroupForm);

  /**
   * POST /site/groups/:groupId/update
   * Updates an existing group (requires authentication).
   *
   * @route POST /site/groups/:groupId/update
   * @returns {void}
   */
  app.post('/site/groups/:groupId/update', ensureAuthenticated, site.updateGroup);

  /**
   * POST /site/groups/:groupId/delete
   * Deletes an existing group (requires authentication).
   *
   * @route POST /site/groups/:groupId/delete
   * @returns {void}
   */
  app.post('/site/groups/:groupId/delete', ensureAuthenticated, site.deleteGroup);

  /**
   * POST /site/groups/:groupId/players
   * Adds a player to the given group (requires authentication).
   *
   * @route POST /site/groups/:groupId/players
   * @returns {void}
   */
  app.post('/site/groups/:groupId/players', ensureAuthenticated, site.addPlayer);

  /**
   * POST /site/groups/:groupId/players/:playerId/delete
   * Removes a player from the given group (requires authentication).
   *
   * @route POST /site/groups/:groupId/players/:playerId/delete
   * @returns {void}
   */
  app.post('/site/groups/:groupId/players/:playerId/delete', ensureAuthenticated, site.removePlayer);

  /**
   * GET /site/groups/:groupId
   * Renders the group details page (requires authentication).
   *
   * @route GET /site/groups/:groupId
   * @returns {void}
   */
  app.get('/site/groups/:groupId', ensureAuthenticated, site.getGroupDetails);




  // ============= API ROUTES (JSON) =============

  // Users
  /**
   * POST /api/users
   * Creates a new user.
   *
   * @route POST /api/users
   * @returns {void}
   */
  app.post('/api/users', usersAPI.addUser);

  // Competitions
  /**
   * GET /api/competitions
   * Returns all available competitions.
   *
   * @route GET /api/competitions
   * @returns {void}
   */
  app.get('/api/competitions', competitionsAPI.getAll);

  /**
   * GET /api/competitions/:code/teams
   * Returns teams for a given competition code.
   *
   * @route GET /api/competitions/:code/teams
   * @returns {void}
   */
  app.get('/api/competitions/:code/teams', competitionsAPI.getTeamsByCompetition);

  // Groups API - Authentication middleware
  /**
   * API authentication middleware.
   * Requires an Authorization header with a Bearer token.
   * Note: This middleware validates presence only (does not validate token contents).
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   * @returns {void}
   */
  const apiAuthMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    next();
  };

  //Groups (Bearer token required)
  /** @route GET /api/groups */
  app.get('/api/groups', apiAuthMiddleware, groupsAPI.getAll);
  /** @route POST /api/groups */
  app.post('/api/groups', apiAuthMiddleware, groupsAPI.create);
  /** @route GET /api/groups/:groupId */
  app.get('/api/groups/:groupId', apiAuthMiddleware, groupsAPI.getById);
  /** @route PUT /api/groups/:groupId */
  app.put('/api/groups/:groupId', apiAuthMiddleware, groupsAPI.update);
  /** @route DELETE /api/groups/:groupId */
  app.delete('/api/groups/:groupId', apiAuthMiddleware, groupsAPI.remove);
  /** @route POST /api/groups/:groupId/players */
  app.post('/api/groups/:groupId/players', apiAuthMiddleware, groupsAPI.addPlayer);
  /** @route DELETE /api/groups/:groupId/players/:playerId */
  app.delete('/api/groups/:groupId/players/:playerId', apiAuthMiddleware, groupsAPI.removePlayer);

  // Root endpoint
  /**
   * GET /
   * Health-check endpoint.
   *
   * @route GET /
   * @returns {void}
   */
  app.get('/', (req, res) => {
    res.send('FOCCACIA API is running!'); 
  });

  // Error handling
  /**
   * Express error-handling middleware.
   * Converts invalid JSON payloads to a 400 response; falls back to 500 otherwise.
   *
   * @param {any} err
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   * @returns {void}
   */
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Bad JSON format' });
    }
    console.error(err);
    res.status(500).json({
      code: 500,
      error: "Internal Server Error"
    });
  });

  // App listening...
  app.listen(PORT, () =>
    console.log(`FOCCACIA API running on port ${PORT}!`),
  );

}
