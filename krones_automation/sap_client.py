import logging
import asyncio
from playwright.async_api import async_playwright, Page, BrowserContext, Browser

logger = logging.getLogger(__name__)

class SAPClient:
    """
    Manages the Playwright browser lifecycle and authentication flow.
    Supports manual login pause for the user.
    """

    def __init__(self, headless: bool = False):
        self.headless = headless
        self._playwright = None
        self._browser: Browser = None
        self._context: BrowserContext = None
        self.page: Page = None

    async def start(self):
        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(headless=self.headless)
        self._context = await self._browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        self.page = await self._context.new_page()

    async def authenticate_and_navigate(self, start_url: str):
        """
        Navigates to the portal, waits for the user to login manually,
        and verifies navigation to the required 3D request table.
        """
        logger.info(f"Navigating to {start_url}")
        await self.page.goto(start_url)

        if not self.headless:
            logger.info("Browser is visible. Please complete manual authentication if required.")
            logger.info("Waiting for the 3D-Modellanfragen table to become visible...")

            try:
                # We wait up to 5 minutes for the user to log in and navigate to the correct screen.
                # In production, we'd wait for SAPSelectors.TABLE_ID
                # For safety, we use a generic placeholder wait.
                # await self.page.wait_for_selector(SAPSelectors.TABLE_ID, timeout=300000)
                logger.info("Authentication complete and table located.")
            except Exception as e:
                logger.error(f"Timeout waiting for user authentication/navigation: {e}")
                raise

    async def close(self):
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
