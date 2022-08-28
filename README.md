A simple tool to get information from your LycaMobile account

```
Usage: -n <number> -p <password>

Options:
      --help      Show help
      --version   Show version number
  -n, --phone     Phone number, format 33000000000
  -p, --password  Password
  -d, --domain    Domain, www.lycamobile.fr by default
```

### Installation

Clone this repository, then use locally from the working folder or install the utility globally — enter in the console while inside the cloned repository:

```
npm install -g .
```

### Example of usage

```
lycamobile -n 33000000000 -p XYZXYZ

* Phone: +33000000000
* Money balance: €9,69
* Internet balance: 41.50GB
* Expiration: 28-02-2022
```

### License

[The Unlicense](https://unlicense.org)