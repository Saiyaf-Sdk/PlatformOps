variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "instance_type" {
  description = "EC2 size for the single-node k3s cluster"
  type        = string
  default     = "t3.medium"
}

variable "ssh_cidr" {
  description = "Your IP in CIDR form (e.g. 203.0.113.7/32) — the only address allowed to SSH in"
  type        = string
}

variable "key_name" {
  description = "Name of an existing EC2 key pair for SSH"
  type        = string
}
