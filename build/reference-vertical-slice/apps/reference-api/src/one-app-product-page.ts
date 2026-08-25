import { ONE_APP_PRODUCT_JOURNEY_PAGE } from './one-app-product-journey-page.ts';

// Keep the R1-02 product truth language as a visible footer while the product
// grows into later authority stages. These statements remain product law:
// interpretation is never automatic business truth, and later authority is separate.
const R1_02_TRUTH_FOOTER = '<footer style="max-width:1460px;margin:0 auto;padding:0 28px 28px;color:#94a3b8;font:12px/1.5 Inter,ui-sans-serif,system-ui">Bring the real process. Never automatic. Separate authority.</footer>';

export const ONE_APP_PRODUCT_PAGE = ONE_APP_PRODUCT_JOURNEY_PAGE.replace('</body>', `${R1_02_TRUTH_FOOTER}</body>`);
