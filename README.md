# license-admin

Admin page for creating and managing theme activation codes. Plain HTML and JavaScript, with no build step and no dependencies.

The backend is in the `license-backend` repo.

## How to use

Open `index.html` directly in a browser, or host this folder on Vercel / Netlify / a subfolder of navegaid.com.

1. Enter the **Server URL** `https://license.navegaid.com` and your **Admin code**: 4msLJc018HBCsoXuDG2kT2ck6InROW3BjDymLxEGwmhYhqw2C2oJEBwpfauHl3XM , then click **Connect**. Both are saved in your browser.
2. **Create a code**: fill in the **Theme ID** (e.g. `navegaid-beauty`) and the **Order ID** from Etsy (required). Buyer email and note are optional. Click **Create code** → **Copy code** → send it to the buyer via Etsy Messages.
3. **Find & manage**: search by code, order ID, store domain, or email. Each row has these buttons:
   - **Reset** — the merchant is moving to another store; the next store that uses the code becomes its owner
   - **Revoke** — deactivate the code
   - **Restore** — reactivate it

## Requirements

The domain this page is hosted on must be listed in `ADMIN_ALLOWED_ORIGINS` in the backend `.env`. Otherwise the browser will block the requests with a CORS error.

Anyone can open this page, but it is useless without the admin code. Do not save the code on a shared computer.