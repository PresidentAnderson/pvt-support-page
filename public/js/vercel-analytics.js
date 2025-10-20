// Vercel Analytics Integration
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Vercel Analytics
if (typeof window !== 'undefined') {
    // Inject analytics with custom configuration
    inject({
        mode: 'production',
        beforeSend: (event) => {
            // Custom tracking logic can be added here
            return event;
        }
    });
    
    // Inject Speed Insights for Web Vitals monitoring
    injectSpeedInsights({
        framework: 'vanilla',
        route: window.location.pathname
    });
}

// Export for use in other modules if needed
export { inject as injectAnalytics, injectSpeedInsights };