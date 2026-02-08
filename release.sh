#!/bin/bash

# GitHub Auto Release Script for IPMDS
# Usage: ./release.sh [patch|minor|major] [--dry-run] [--no-release]
# Example: ./release.sh patch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLIENT_PKG="client/package.json"
SERVER_PKG="server/package.json"
README_FILE="README.md"
RELEASE_NOTES="RELEASE_NOTES.md"

# Parse arguments
VERSION_BUMP="patch"
DRY_RUN=false
CREATE_RELEASE=true

for arg in "$@"; do
  case $arg in
    patch|minor|major)
      VERSION_BUMP=$arg
      ;;
    --dry-run)
      DRY_RUN=true
      ;;
    --no-release)
      CREATE_RELEASE=false
      ;;
    --help|-h)
      echo "Usage: ./release.sh [patch|minor|major] [--dry-run] [--no-release]"
      echo ""
      echo "Options:"
      echo "  patch       Bump patch version (0.0.1 -> 0.0.2) [default]"
      echo "  minor       Bump minor version (0.0.1 -> 0.1.0)"
      echo "  major       Bump major version (0.0.1 -> 1.0.0)"
      echo "  --dry-run   Show what would be done without executing"
      echo "  --no-release  Skip creating GitHub release"
      echo "  --help, -h  Show this help message"
      exit 0
      ;;
  esac
done

# Functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Get current version from server package.json
get_current_version() {
  if [ -f "$SERVER_PKG" ]; then
    cat "$SERVER_PKG" | grep '"version"' | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[:space:]'
  else
    echo "0.0.0"
  fi
}

# Bump version number
bump_version() {
  local version=$1
  local bump=$2

  # Split version into parts
  local major=$(echo $version | cut -d. -f1)
  local minor=$(echo $version | cut -d. -f2)
  local patch=$(echo $version | cut -d. -f3)

  case $bump in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    patch)
      patch=$((patch + 1))
      ;;
  esac

  echo "$major.$minor.$patch"
}

# Update version in package.json
update_package_version() {
  local file=$1
  local version=$2

  if [ "$DRY_RUN" = true ]; then
    log_info "Would update $file to version $version"
  else
    # Use sed to update version in package.json (cross-platform compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$version\"/" "$file"
    else
      # Linux
      sed -i "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$version\"/" "$file"
    fi
    log_success "Updated $file to version $version"
  fi
}

# Update version badge in README.md
update_readme_version() {
  local version=$1

  if [ ! -f "$README_FILE" ]; then
    log_warning "README.md not found, skipping version badge update"
    return 0
  fi

  if [ "$DRY_RUN" = true ]; then
    log_info "Would update $README_FILE version badge to $version"
  else
    # Update version badge in README.md (cross-platform compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      sed -i '' "s/version-[0-9]*\.[0-9]*\.[0-9]*-blue/version-$version-blue/" "$README_FILE"
    else
      # Linux
      sed -i "s/version-[0-9]*\.[0-9]*\.[0-9]*-blue/version-$version-blue/" "$README_FILE"
    fi
    log_success "Updated $README_FILE version badge to $version"
  fi
}

# Check if gh CLI is installed
check_gh_cli() {
  if ! command -v gh &> /dev/null; then
    log_warning "GitHub CLI (gh) is not installed"
    echo "Install it from: https://cli.github.com/"
    return 1
  fi
  return 0
}

# Check if user is logged in to gh
check_gh_auth() {
  if ! gh auth status &> /dev/null; then
    log_error "Not authenticated with GitHub CLI"
    echo "Run: gh auth login"
    return 1
  fi
  return 0
}

# Get the last commit messages for release notes
get_release_notes() {
  local version=$1
  local last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

  echo "## Changes in $version"
  echo ""

  if [ -z "$last_tag" ]; then
    echo "### Commits"
    git log --pretty=format:"- %s (%h)" --no-merges | head -20
  else
    echo "### Changes since $last_tag"
    git log --pretty=format:"- %s (%h)" --no-merges "$last_tag..HEAD" | head -20
  fi

  echo ""
  echo "### Full Changelog"
  echo "https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/commits/$version"
}

# Create GitHub release
create_github_release() {
  local version=$1
  local tag=$2

  if [ "$CREATE_RELEASE" = false ]; then
    log_info "Skipping GitHub release creation (--no-release)"
    return 0
  fi

  if ! check_gh_cli || ! check_gh_auth; then
    log_warning "Skipping GitHub release creation"
    return 0
  fi

  # Check if release already exists
  if gh release view "$tag" &> /dev/null; then
    log_warning "Release $tag already exists"
    return 0
  fi

  # Generate release notes
  local notes=$(get_release_notes "$version")

  if [ "$DRY_RUN" = true ]; then
    log_info "Would create GitHub release $tag"
    echo "Release notes preview:"
    echo "$notes"
  else
    log_info "Creating GitHub release $tag..."

    # Create release notes file
    echo "$notes" > "$RELEASE_NOTES"

    # Create the release
    gh release create "$tag" \
      --title "Release $version" \
      --notes-file "$RELEASE_NOTES" \
      --target main

    # Clean up
    rm -f "$RELEASE_NOTES"

    log_success "GitHub release $tag created successfully!"
  fi
}

# Main release process
main() {
  log_info "Starting release process..."
  log_info "Version bump type: $VERSION_BUMP"

  # Check if we're in a git repository
  if [ ! -d ".git" ]; then
    log_error "Not a git repository. Please run from the project root."
    exit 1
  fi

  # Check for uncommitted changes
  if ! git diff-index --quiet HEAD --; then
    log_error "You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
  fi

  # Get current version
  CURRENT_VERSION=$(get_current_version)
  log_info "Current version: $CURRENT_VERSION"

  # Calculate new version
  NEW_VERSION=$(bump_version "$CURRENT_VERSION" "$VERSION_BUMP")
  log_info "New version: $NEW_VERSION"

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN MODE - No changes will be made"
  fi

  # Update package.json files
  update_package_version "$SERVER_PKG" "$NEW_VERSION"
  update_package_version "$CLIENT_PKG" "$NEW_VERSION"

  # Update README.md version badge
  update_readme_version "$NEW_VERSION"

  # Stage changes
  if [ "$DRY_RUN" = false ]; then
    git add "$SERVER_PKG" "$CLIENT_PKG" "$README_FILE"

    # Commit version bump
    git commit -m "chore(release): bump version to $NEW_VERSION"
    log_success "Created commit for version bump"

    # Create tag
    TAG="v$NEW_VERSION"
    git tag -a "$TAG" -m "Release $NEW_VERSION"
    log_success "Created tag: $TAG"

    # Push to GitHub
    log_info "Pushing to GitHub..."
    git push origin main
    git push origin "$TAG"
    log_success "Pushed to GitHub"

    # Create GitHub release
    create_github_release "$NEW_VERSION" "$TAG"

    log_success "Release $NEW_VERSION completed successfully!"
    echo ""
    echo "Summary:"
    echo "  - Version bumped: $CURRENT_VERSION -> $NEW_VERSION"
    echo "  - Commit created and pushed"
    echo "  - Tag $TAG created and pushed"
    if [ "$CREATE_RELEASE" = true ] && command -v gh &> /dev/null; then
      echo "  - GitHub release created"
    fi
  else
    log_info "Dry run complete. No changes were made."
  fi
}

# Run main function
main
