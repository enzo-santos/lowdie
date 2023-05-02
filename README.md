# Lowdie

A nice bot who plays rock-paper-scissors and tic-tac-toe.
    
## Usage

### Locally

Clone this repository:

```shell
git clone https://github.com/enzo-santos/lowdie.git
cd lowdie
```

Install the dependencies:

```shell
npm install
```

Run the bot locally:

```shell
npm run local
```

Interact with the bot:

```none
$ Greet Lowdie!
>
```

A `$` prefix indicates a shell response. A `>` prefix indicates your response. No prefix indicates Lowdie's response. 
Type anything into the shell:


```none
$ Greet Lowdie!
> Hi!
Hi! I'm Lowdie, but you can call me Lodi. I'm pretty sure we're gonna
have fun! So, what we're gonna play?

$ Choose from "Rock-paper-scissors", "Tic-tac-toe":
>
```

Follow the shell response and type either `Rock-paper-scissors` or `Tic-tac-toe`:

```none
$ Greet Lowdie!
> Hi!
Hi! I'm Lowdie, but you can call me Lodi. I'm pretty sure we're gonna 
have fun! So, what we're gonna play?

$ Choose from "Rock-paper-scissors", "Tic-tac-toe":
> Rock-paper-scissors
Select your move.

$ Choose from "Rock", "Paper", "Scissors":
>
```

Continue the interaction and have fun!

### On Telegram (currently offline)

Start a conversation with [@lowdiebot](https://t.me/lowdiebot) on Telegram.

### On your backend

#### Certificating your bot

You need to install OpenSSL. You can Google to find out how to install it, but there is a simple way if you have Git 
installed. First, make sure Git is installed (in my case, it's a portable version):

```shell
$ where git
C:\SomePath\PortableGit\bin\git.exe
```

Now execute the following directory walking:

```shell
$ cd C:\SomePath\PortableGit\bin
$ cd ..\usr\bin
$ openssl version
OpenSSL 1.1.1q  5 Jul 2022
```

This is the executable of OpenSSL. Note that this may or may not work for you.

With this binary, run the following command in your shell:

```shell
$ openssl genrsa -out C:\SomePath\key.pem 2048
Generating RSA private key, 2048 bit long modulus (2 primes)
e is 65537 (0x010001)
```

Store the generated *key.pem* file **privately**.

With the same binary, run the following command:

```shell
$ openssl req -new -sha256 -key C:\SomePath\key.pem -out C:\SomePath\crt.pem
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:
State or Province Name (full name) [Some-State]:
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:
Email Address []:

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
```

Store the generated *crt.pem* file (it doesn't necessarily need to be store privately).

Additionally, copy the file into this project's root directory.

#### Authenticating your bot

Start a conversation with [@botfather](https://t.me/botfather) on Telegram, creating your new bot:

> **You:** /newbot
> 
> **BotFather:** Alright, a new bot. How are we going to call it? Please choose a name for your bot.
> 
> **You:** *(pick a name for your bot)*
> 
> **BotFather:** Good. Now let's choose a username for your bot. It must end in `bot`. Like this, for example: 
> TetrisBot or tetris_bot.
> 
> **You:** *(pick a username for your bot)*
> 
> **BotFather:** Done! Congratulations on your new bot. You will find it at *(your bot's url)*. You can now add a 
> description, about section and profile picture for your bot, see /help for a list of commands. By the way, when you've
> finished creating your cool bot, ping our Bot Support if you want a better username for it. Just make sure the bot is 
> fully operational before you do this. 
> 
> Use this token to access the HTTP API: *(your bot's token)*. Keep your token secure and store it safely, it can be 
> used by anyone to control your bot.
>
> For a description of the Bot API, see this page: https://core.telegram.org/bots/api

Store your bot's authentication token **privately**, as the BotFather said.

Additionally, create a file in this project's root directory named *.env* and add the following content to it:

```dotenv
LOWDIE_TOKEN=yourbotstoken
```

#### Hosting your bot

You'll need a hosting platform that supports webhooks. 
[Azure](https://learn.microsoft.com/en-us/azure/azure-functions/create-first-function-cli-typescript?tabs=azure-cli%2Cbrowser&pivots=nodejs-model-v4#deploy-the-function-project-to-azure)
and 
[Google Cloud](https://cloud.google.com/functions/docs/calling/http#deployment)
do. This example will use Google Cloud.

Download and install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install): 

```shell
$ gcloud --version
Google Cloud SDK 428.0.0
beta 2023.04.25
bq 2.0.91
core 2023.04.25
gcloud-crc32c 1.0.0
gsutil 5.23
```

Then run the following commands in your shell: 

```shell
$ gcloud config set project <your-gcloud-project-name>
$ gcloud services enable artifactregistry.googleapis.com
$ gcloud services enable run.googleapis.com
$ npm run deploy
```