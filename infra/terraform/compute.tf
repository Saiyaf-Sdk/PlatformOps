data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
}

# The node may pull from ECR and read/write the artifacts bucket — nothing else.
resource "aws_iam_role" "node" {
  name = "platformops-k3s-node"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy" "artifacts" {
  name = "artifacts-bucket"
  role = aws_iam_role.node.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
      Resource = [aws_s3_bucket.artifacts.arn, "${aws_s3_bucket.artifacts.arn}/*"]
    }]
  })
}

resource "aws_iam_instance_profile" "node" {
  name = "platformops-k3s-node"
  role = aws_iam_role.node.name
}

resource "aws_instance" "k3s" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.k3s.id]
  key_name               = var.key_name
  iam_instance_profile   = aws_iam_instance_profile.node.name

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  metadata_options { http_tokens = "required" } # IMDSv2 only

  # k3s without Traefik (we use NGINX Ingress), then NGINX Ingress + Argo CD
  user_data = <<-EOT
    #!/bin/bash
    set -euxo pipefail
    curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik --write-kubeconfig-mode 644" sh -
    export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
    until kubectl get nodes; do sleep 5; done
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/cloud/deploy.yaml
    kubectl create namespace argocd || true
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
  EOT

  tags = { Name = "platformops-k3s" }
}

resource "aws_eip" "k3s" {
  instance = aws_instance.k3s.id
  domain   = "vpc"
}
