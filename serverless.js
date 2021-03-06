const { Component } = require('@serverless/core')
const { equals, is, isEmpty, isNil, mergeDeepRight, not } = require('ramda')

const {
  constructTemplateS3Key,
  createOrUpdateStack,
  deleteStack,
  fetchOutputs,
  getClients,
  getPreviousStack,
  loadTemplate,
  uploadTemplate,
  updateTerminationProtection
} = require('./utils')

const defaults = {
  enableTerminationProtection: false,
  parameters: {},
  region: 'us-east-1',
  role: undefined,
  rollbackConfiguration: {},
  disableRollback: false,
  capabilities: []
}

class AwsCloudFormation extends Component {
  async default(inputs = {}) {
    this.context.status('Deploying')
    const config = mergeDeepRight(defaults, inputs)
    config.bucket = this.state.bucket || config.bucket
    config.timestamp = Date.now()

    if (is(String, config.template)) {
      this.context.debug('Load template file.')
      config.template = await loadTemplate(config.template)
    }

    if (isNil(config.template) || isNil(config.stackName)) {
      throw new Error('Invalid inputs; template and stackName are required.')
    }

    const { cloudformation, s3 } = getClients(this.context.credentials.aws, config.region)

    let stackOutputs = {}
    const previousStack = await getPreviousStack(cloudformation, config)
    if (previousStack.needsUpdate) {
      if (not(isNil(config.bucket))) {
        config.templateS3Key = constructTemplateS3Key(config)
        this.context.debug(
          `Uploading template ${config.templateS3Key} to S3 bucket ${config.bucket}.`
        )
        await uploadTemplate(s3, config)
      }

      this.context.debug(`Deploying stack ${config.stackName}.`)
      stackOutputs = await createOrUpdateStack(
        cloudformation,
        config,
        not(isEmpty(previousStack.stack))
      )
    } else {
      this.context.debug(`Fetching stack outputs from stack ${config.stackName}.`)
      stackOutputs = await fetchOutputs(cloudformation, config)
    }

    await updateTerminationProtection(
      cloudformation,
      config,
      !!previousStack.stack.EnableTerminationProtection
    )

    if (not(isNil(this.state.stackName)) && not(equals(this.state.stackName, config.stackName))) {
      this.context.debug(
        `Delete stack ${this.state.stackName} prior to creation of ${config.stackName}.`
      )
      await deleteStack(cloudformation, this.state)
    }

    this.state = {
      bucket: config.bucket,
      region: config.region,
      stackName: config.stackName
    }
    await this.save()
    return stackOutputs
  }

  async remove() {
    this.context.status('Removing')
    if (!this.state.stackName) {
      this.context.debug(`Aborting removal. Stack name not found in state.`)
      return
    }
    const { cloudformation } = getClients(this.context.credentials.aws, this.state.region)
    this.context.debug(`Deleting stack ${this.state.stackName}.`)
    await deleteStack(cloudformation, this.state)
    this.state = {}
    await this.save()
    return {}
  }
}

module.exports = AwsCloudFormation
