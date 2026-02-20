/**
 * MODEL Layer - Index
 *
 * Exports all data-related services, types, and configurations.
 * This is the "M" in MVC — responsible for data management,
 * Firebase interactions, and business data types.
 */

// Firebase Services
export * from './services/auth';
export * from './services/parkingSpots';
export * from './services/storage';
export { default as firebaseConfig } from './config';

// Types & Constants (re-exported from types/)
export * from './types/index';
