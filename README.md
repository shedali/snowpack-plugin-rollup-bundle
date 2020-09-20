# snowpack-plugin-rollup-bundle

A snowpack plugin to build your files for production using Rollup.

## Issues

Currently, this only generates build files but will not rewrite your
HTML scripts. If you would like to see this feature, I would be happy to
add it. For now, this project is purely for the use of Snowpacker.

1 CSS file is generated per entrypoint. In addition, you must manually
add your stylesheets into your built HTML files with a stylesheet `<link />` tag.

## Developing locally

```bash
git clone https://github.com/ParamagicDev/snowpack-plugin-rollup-bundle
cd snowpack-plugin-rollup-bundle
yarn install
yarn build
```

### Using in example directory

```bash
cd __tests__/example_dir
yarn install
yarn snowpack build
```

Then you must manually copy the HTML file from the `src/` directory
and then fix the entrypoint route to the hashed version. You must
also add in the generated CSS file.

Then you can run:

```bash
yarn servor build
```

Then navigate to `localhost:8080` to see the final build.

### Expected input

```bash
src/
  assets/
  stylesheets/
  entrypoints/
    entrypoint1.js
    entrypoint2.js
  javascript/
```

### Expected output

```bash
build/
  chunks/
    chunk1.hash.js

  entrypoints/
    entrypoint1-hash.js
    entrypoint2-hash.js

  css/
    # 1 css file per entrypoint
    entrypoint1-hash.css
    entrypoint2-hash.css

  assets/
    asset1-hash.png
    asset2-hash.jpg

  manifest.json # A manifest of all file locations
```

Note: CSS files with correspond with an entrypoint file and will not
maintain your naming from a stylesheets directory.

## Testing

```bash
git clone https://github.com/ParamagicDev/snowpack-plugin-rollup-bundle/tree/development/
cd snowpack-plugin-rollup-bundle
yarn install
yarn test
```

You can then view the generated build in the `__tests__/example_dir/build` directory.

### Using docker

```bash
git clone https://github.com/ParamagicDev/snowpack-plugin-rollup-bundle/tree/development/
cd snowpack-plugin-rollup-bundle
source docker.env

docker-compose up --build

# OR

docker-compose run --rm web yarn test
```

## Customization

```js
// snowpack.config.js

const plugins = [
  // ...
  [
    "snowpack-plugin-rollup-bundle",
    {
      emitHtmlFiles: <boolean>,
      preserveSourceFiles: <boolean>,
      extendConfig: (config) => {
        config.outputOptions = { ... } // https://rollupjs.org/guide/en/#outputoptions-object
        config.inputOptions = { ... } // https://rollupjs.org/guide/en/#outputoptions-object

        return config
      }
    }
  ]
]

module.exports = {
  plugins: plugins
}
```

### Plugin Options

#### `emitHtmlFiles`

`type: Boolean`
<br />
`default: false`

If your source directory contains HTML files, this will rewrite your
script tags.

#### `preserveSourceFiles`

`type: Boolean`
<br />
`default: false`

This is meant as a debugging tool. This will put the original build
files from Snowpack into a `_source_` directory.

## Roadmap

- [x] Change hashing from `x.hash.ext` to `x-hash.ext`

- [ ] Cypress testing to ensure build and dev work the same

- [x] Support emitting HTML files with proper `<script>` and `<link
rel="stylesheet">` tags.
