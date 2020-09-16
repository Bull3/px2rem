### Getting Started

```bash
yarn 
yarn test // then you can see the processed result in test.result.css
```

# [auto-px2rem-loader](https://www.npmjs.com/package/auto-px2rem-loader)

a [webpack](http://webpack.github.io/) loader for auto-px2rem

Fork [px2rem](https://www.npmjs.com/package/px2rem), add below config which can auto process `px` unit without `/*px*/` and `/*no*/` in  [px2rem](https://www.npmjs.com/package/px2rem)

## default config

- remUnit: 75   //comments have highest priority
- remPrecision: 6
- forcePxComment: 'px'
- forceRemComment: 'rem'
- keepComment: 'no'

- autoDealPx: ['font-size']

- autoDealNo: ['border-radius', 'border', 'box-shadow', 'min-width', 'min-height', 'max-width', 'max-height']

- appendAutoDealPx: []  //you can add extra autoDealPx

- appendAutoDealNo: [] //you can add extra autoDealNo

- ```js
  mediaQuery: [ //default config
      {
        mediaType: '(max-width: 1280px)',
        ratio: 0.5 //px sacle ratio
      },
      {
        mediaType: '(min-width: 1281px) and (max-width: 1920px)',
        ratio: 1
      },
      {
        mediaType: '(min-width: 1921px)',
        ratio: 1.5
      }
    ]
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
          remUnit: 100,
          remPrecision: 5
        }
      }]
    }]
  }
}
```

### auto-px2rem processing result

#### Pre processing:

One raw stylesheet: `test.css`

```css
.selector {
  width: 150px;
  height: 64px; /*px*/
  font-size: 28px; /*auto generate 3 new size, same effect as px comment */
  border: 1px solid #ddd; /*no deal boeder px, same effect as no comment */
}
```

#### After processing:

Rem version: `test.result.css`

```css
.selector {
  width: 2rem;
  /*auto generate 3 new size, same effect as px comment */
  border: 1px solid #ddd;
  /*no deal boeder px, same effect as no comment */
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