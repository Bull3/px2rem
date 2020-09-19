# Getting Started

```bash
yarn 
yarn test // then you can see the processed result in test.result.css
```

# auto-px2rem-loader

>  **a [webpack](https://www.webpackjs.com/loaders/) loader to process css file which can convert `px` uint to `rem` and `media query` code**
## Before processing:

The raw stylesheet:

```css
.selector {
  width: 150px;
  height: 64px; /*px*/
  margin-top: 10px; /*no*/
  font-size: 28px;
  border: 1px solid #ddd;
}
```

## After processing:

Rem and Media Query version: 

```css
.selector {
  width: 2rem;
  margin-top: 10px;
  border: 1px solid #ddd;
}

@media (max-width: 1280px) {
  .selector {
    height: 32px;
    font-size: 14px;
  }
}

@media (min-width: 1281px) and (max-width: 1920px) {
  .selector {
    height: 64px;
    font-size: 28px;
  }
}

@media (min-width: 1921px) {
  .selector {
    height: 96px;
    font-size: 42px;
  }
}
```


## Install

`npm install auto-px2rem-loader`

## webpack config

```js
module.exports = {
  // ...
  module: {
    rules: [{
      test: /\.css$/,
      use: [{
        loader: 'style-loader'
      }, {
        loader: 'css-loader'
      }, {
        loader: 'auto-px2rem-loader',
        // options here
        options: {
          remUnit: 100
        }
      }]
    }]
  }
}
```
## All loader options

>  **There are all default configurations in the loader, you can also customize them in the webpack config file**

```js
{
  loader: 'auto-px2rem-loader',
  options: {
    remUnit: 75, // rem unit value (default: 75)
    remPrecision: 6, // rem value precision (default: 6)
    forcePxComment: 'px', // force px comment (default: `px`)
    forceRemComment: 'rem', // force rem comment (default: `rem`)
    keepComment: 'no', // no conversion comment (default: `no`)
    // comment has higher priority than autodeal css properties
    // these css properties will be converted into media query
    autoDealPx: ['font-size'], 
    // these css properties will not be converted
    autoDealNo: [
      'border-radius',
      'border',
      'box-shadow',
      'min-width',
      'min-height',
      'max-width',
      'max-height',
    ],
    appendAutoDealPx: [], // this will merge to autoDealPx
    appendAutoDealNo: [], // this will merge to autoDealNo
    mediaQuery: [// media query rules
      {
        mediaType: '(max-width: 1280px)', // media query width
        ratio: 0.5, // conversion ratio
      },
      {
        mediaType: '(min-width: 1281px) and (max-width: 1920px)',
        ratio: 1,
      },
      {
        mediaType: '(min-width: 1921px)',
        ratio: 1.5,
      }
    ]
  }
}
```
