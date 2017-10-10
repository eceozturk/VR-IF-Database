# Test-Assets-Dataset

![](http://dashif.org/wp-content/uploads/2014/12/dashif-logo-283x100.jpg)

Welcome to the Test-Assets-Dataset!

* [Architecture overview] (https://github.com/Dash-Industry-Forum/Test-Assets-Dataset/blob/master/doc/architecture.md)
* [Installation Guide](https://github.com/Dash-Industry-Forum/Test-Assets-Dataset/blob/master/doc/installation.md)

### Introduction

DASH-IF Test assets include

- Categorized DASH-IF features.
- Test cases for the individual features.
- Test vectors for the test cases.
- Conformance software.

DASH-IF currently uses “go-daddy” web services to host the data for the first 3 items above. The current issues of this approach include

Current data representation in HTML is not scalable to the size of the assets. Especially, presentation of data being tightly linked to the data itself causes extensibility issues.
Options to structure and link different data tables are limited and are not scalable.
There are no different user privileges to access, manage and update the data.
There is no possibility of a backup.
Hence it a database + front-end based approach is needed to address the issues and ensure extensibility as well.

This repository is aimed at hosting all necessary software, data and documents.
