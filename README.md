# Blackjack API

> REST API for the Blackjack app

## About

This is the API for the Blackjack app, a project done as part of the application process for winning a spot at PeerWell.

## How To Set Up a Dev Environment

If you would like to contribute to the API's development, here's how you can get the API up and running locally.

1. Install necessary software:
    1. [NodeJS](https://nodejs.org/) Please install the v12.x LTS version (or higher).
    2. [Git](https://git-scm.com/)
    3. [`mkcert`](https://github.com/FiloSottile/mkcert)
    4. [VSCode](https://code.visualstudio.com/)
    5. [MongoDB Compass](https://www.mongodb.com/products/compass) (optional, but nice for seeing what's in the DB)
2. Clone this repo to your local `dev` folder and install NPM dependencies:

    ```sh
    cd ~/dev
    git clone https://github.com/morphatic/blackjack-api.git
    cd caer-api
    npm install
    ```

3. Edit your `hosts` file ([here's a tutorial](https://www.howtogeek.com/howto/27350/beginner-geek-how-to-edit-your-hosts-file/)) so you can use a "real" domain name on your dev server. Add the entry `127.0.0.1 api.blackjack.test`
4. Install a local SSL certificate in the root `blackjack-api` directory (command with example output)

    ```sh
    $ mkcert api.blackjack.test
    Using the local CA at "/Users/yourusername/Library/Application Support/mkcert" ✨

    Created a new certificate valid for the following names 📜
    - "api.blackjack.test"

    The certificate is at "./api.blackjack.test.pem" and the key at "./api.blackjack.test-key.pem" ✅
    ```

5. If you don't have one, create an account on [the MongoDB website](https://mongodb.com). Ask someone with access to invite you to the Morphatic organization on the MongoDB Atlas site. (NOTE: for this and the next couple of steps, you can alternatively set up Mongo/Magic services that are entirely under your own control and wire them up accordingly.)
6. Go into the Morphatic > Blackjack project and go to the "Database Access" section. Click the green "Add New Database User" button and add a user with your first name, all lowercase. Make sure to click the "Autogenerate Secure Password" button and **COPY THE PASSWORD IT GIVES YOU!!!** Store this password someplace safe and private that you won't lose it.
7. Set up the necessary environment variables on your system ([Windows instructions](https://www.youtube.com/watch?v=Kj3FSWoKYfo)/[OSX/Linux instructions](https://medium.com/@himanshuagarwal1395/setting-up-environment-variables-in-macos-sierra-f5978369b255))
    1. BLACKJACK_DEV_DB: a name, e.g. blackjack_api_morgan, that is unique to you (i.e. don't use MY name)
    2. BLACKJACK_DEV_PW: the password you created in step #6
    3. BLACKJACK_DEV_USER: the username you set up in MongoDB Atlas for personal access to the CAER App Development Project
    4. BLACKJACK_MAGIC_SECRET: you'll need to ask Morgan for this
8. Start up the server by running `npm run dev` from the terminal. This will startup the server locally on your machine at [`https://api.blackjack.test:3030`](https://api.blackjack.test:3030).
9. BEFORE you start the frontend server, create a file called `.env.local` in the root directory of the CAER **FRONTEND** repo. Create a variable in that file called VUE_APP_API_URL and give it the value of your dev API URL, e.g.

    ```sh
    VUE_APP_API_URL=https://api.blackjack.test:3030
    ```

10. Finally, you can start the frontend server and it should be configured to both use Magic correctly and point to your personal dev database (on MongoDB Atlas), and allow you to test pretty much any functionality on your local system.
