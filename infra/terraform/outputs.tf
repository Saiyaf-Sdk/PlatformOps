output "public_ip" {
  value = aws_eip.k3s.public_ip
}

output "ssh" {
  value = "ssh ubuntu@${aws_eip.k3s.public_ip}"
}

output "ecr_repositories" {
  value = { for k, r in aws_ecr_repository.repo : k => r.repository_url }
}

output "artifacts_bucket" {
  value = aws_s3_bucket.artifacts.bucket
}
