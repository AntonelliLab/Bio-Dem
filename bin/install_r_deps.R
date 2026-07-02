#!/usr/bin/env Rscript
#
# install_r_deps.R -- install the R packages needed to regenerate the app data.
#
# On macOS use the official CRAN R (framework build, /usr/local/bin/Rscript):
# it installs prebuilt binary packages. Homebrew's R only builds from source and
# currently fails to compile the geospatial stack (libc++ mismatch), so prefer
# the CRAN R here.

options(repos = c(CRAN = "https://cloud.r-project.org"))

cran <- c("remotes", "dplyr", "readr", "stringr", "countrycode",
          "sf", "rnaturalearth", "rnaturalearthdata")
missing <- cran[!vapply(cran, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing)) {
  message("Installing CRAN packages: ", paste(missing, collapse = ", "))
  install.packages(missing)   # pkgType 'both' on CRAN R -> uses binaries
}

# vdemdata is not on CRAN; install from GitHub (data + R only, no compilation).
if (!requireNamespace("vdemdata", quietly = TRUE)) {
  message("Installing vdemdata from GitHub")
  remotes::install_github("vdeminstitute/vdemdata", upgrade = "never")
}

cat(sprintf("R deps ready (vdemdata v%s)\n",
            as.character(packageVersion("vdemdata"))))
