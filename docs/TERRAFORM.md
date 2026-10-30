# Terraform change control

Terraform is validated in Pull Request Checks and deployed only by the
protected Azure Infrastructure workflow. The workflow uses Terraform 1.16.1,
the locked AzureRM 4.1.0 provider, and an Azure remote backend configured from
protected workflow secrets.

## Plan and apply

1. The plan job checks formatting, initializes without committing backend
   settings, and creates `infra/tfplan` with `terraform plan -out=tfplan`.
2. That exact binary plan is uploaded as a short-lived workflow artifact.
3. The deploy job waits for the `production` environment approval, checks out
   the same commit, initializes the same backend, downloads the artifact, and
   runs `terraform apply -input=false tfplan`.
4. The subscription ID is supplied as `TF_VAR_subscription_id` from the
   protected `AZURE_SUBSCRIPTION_ID` secret; it is not stored in Terraform
   source.

Do not run an ad-hoc apply, commit `infra/backend.hcl`, or commit Terraform
state. A plan artifact is review evidence, not a substitute for the protected
environment approval.

## Rollback

If production verification fails, stop further infrastructure changes, retain
the failed workflow run and plan for investigation, and revert the reviewed
infrastructure commit through a normal pull request. Run the plan/apply flow
again for that revert and obtain the production environment approval. Do not
overwrite or delete remote state to recover from an application deployment
failure.
