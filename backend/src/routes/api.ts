import { Router } from 'express';
import { getServices, getServiceBySlug } from '../controllers/serviceController';
import { getPortfolio, getProjectById } from '../controllers/portfolioController';
import { getTestimonials } from '../controllers/testimonialController';
import { getTeam } from '../controllers/teamController';
import { submitContact } from '../controllers/contactController';
import { subscribeNewsletter } from '../controllers/newsletterController';

const router = Router();

// Services routes
router.get('/services', getServices);
router.get('/services/:slug', getServiceBySlug);

// Portfolio routes
router.get('/portfolio', getPortfolio);
router.get('/portfolio/:id', getProjectById);

// Testimonials route
router.get('/testimonials', getTestimonials);

// Team route
router.get('/team', getTeam);

// Form routes
router.post('/contact', submitContact);
router.post('/newsletter', subscribeNewsletter);

export default router;
