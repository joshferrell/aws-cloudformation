# AWS Cloudformation

Easily Deploy Cloudformation templates on AWS using [Serverless Components](https://github.com/serverless/components).

&nbsp;

- [AWS Cloudformation](#aws-cloudformation)
    - [1. Install](#1-install)
    - [2. Create](#2-create)
    - [3. Configure](#3-configure)
    - [4. Deploy](#4-deploy)
    - [New to Components?](#new-to-components)

&nbsp;


### 1. Install

```console
$ npm install -g serverless
```

### 2. Create

Just create a `serverless.yml` file

```shell
$ touch serverless.yml
$ touch .env      # your development AWS api keys
$ touch .env.prod # your production AWS api keys
```

the `.env` files are not required if you have the aws keys set globally and you want to use a single stage, but they should look like this.

```
AWS_ACCESS_KEY_ID=XXX
AWS_SECRET_ACCESS_KEY=XXX
```

### 3. Configure

```yml
# serverless.yml

name: my-service
stage: dev

myParameters:
  component: '@serverless/aws-cloudformation'
  inputs:
    bucket: XXX
    template:
      XXX
```

### 4. Deploy

```console
$ serverless
```

### New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
