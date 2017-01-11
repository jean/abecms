import Handlebars from 'handlebars'
import striptags from 'striptags'

import {
  cmsData
  ,config
  ,cmsTemplates
} from '../../'

export function addAbeAttrSingleTab(key, elem, htmlAttribute = null) {
  var res = ''

  var valueOfAttritube = key.replace(/\./g, '-')
  key = cmsData.regex.validDataAbe(valueOfAttritube)
  
  if (htmlAttribute != null) {
    res = ' data-abe-attr-' + valueOfAttritube + '="'  + htmlAttribute + '"' + ' data-abe-' + valueOfAttritube + '="'  + key + '"' + elem
  }else {
    res = ' data-abe-' + key + '="'  + key + '" ' + elem
  }

  return res
}

export function addAbeAttrForBlock(key, elem, htmlAttribute = null) {
  var res = ''

  var valueOfAttritube = key.split('.')
  var parentKey = valueOfAttritube.shift()
  valueOfAttritube = `${parentKey}[index].${valueOfAttritube[0].replace(/\./g, '-')}`
  var valueOfAttritubeIndexed = valueOfAttritube.replace(/\[index\]/, '{{@index}}')
  key = cmsData.regex.validDataAbe(valueOfAttritube)

  if (htmlAttribute) {

    res = ` data-abe-attr-${valueOfAttritube}="${htmlAttribute}"  data-abe-${valueOfAttritube}="${key}"`
      + ` data-abe-attr-${valueOfAttritubeIndexed}="${htmlAttribute}" data-abe-${valueOfAttritubeIndexed}="${key}"${elem}`
  }else {
    res = ` data-abe-${valueOfAttritube}="${key}"`
      + ` data-abe-${valueOfAttritubeIndexed}="${key}" ${elem}`
  }

  return res
}

/**
 * THIS:
<span>{{abe type='text' key='text_visible'}}</span>

 * BECOME:
<span data-abe-text_visible="text_visible" >{{abe type='text' key='text_visible'}}</span>

 * @param {[type]} template [description]
 */
export function addAbeDataAttrForHtmlTag(template) {
  var match
  var key
  var getattr
  var newTemplate = template

  while (match = cmsData.regex.abePattern.exec(template)) {
    key = cmsData.regex.getAttr(match, 'key')

    if (!cmsData.regex.isSingleAbe(match, newTemplate)) {
      key = key.replace('.', '{{@index}}.')
    }

    getattr = key.replace(/\./g, '-')

    newTemplate = newTemplate.replace(
      cmsData.regex.escapeTextToRegex(match[0], 'g'),
      ' data-abe-' + cmsData.regex.validDataAbe(getattr) + '="'  + getattr + '" ' + match[0]
    )
  }

  return newTemplate
}

export function addHasAbeAttr(text) {
  return text.replace('}}', ' has-abe=1}}')
}

export function getAbeAttributeData(match, text, htmlAttribute, abeTag) {
  var valueOfAttritube
  var key = cmsData.regex.getAttr(match, 'key')
  var res

  if (cmsData.regex.isSingleAbe(match, text)) {
    // valueOfAttritube = key.replace(/\./g, '-')
    // key = cmsData.regex.validDataAbe(valueOfAttritube)
    // key = key.replace(/\./g, '-')
    // res = ' data-abe-attr-' + valueOfAttritube + '="'  + htmlAttribute + '"' + ' data-abe-' + valueOfAttritube + '="'  + key + '"' + abeTag
    res = addAbeAttrSingleTab(key, abeTag, htmlAttribute)
  }else {
    res = addAbeAttrForBlock(key, abeTag, htmlAttribute)
    // valueOfAttritube = key.split('.')
    // var parentKey = valueOfAttritube.shift()
    // valueOfAttritube = `${parentKey}[index].${valueOfAttritube[0]}`
    // var valueOfAttritubeIndexed = valueOfAttritube.replace(/\[index\]/, '{{@index}}')
    // key = cmsData.regex.validDataAbe(valueOfAttritube)

    // res = ` data-abe-attr-${valueOfAttritube}="${htmlAttribute}"  data-abe-${valueOfAttritube}="${key}"`
    // + ` data-abe-attr-${valueOfAttritubeIndexed}="${htmlAttribute}" data-abe-${valueOfAttritubeIndexed}="${key}"${abeTag}`
  }

  return res
}

/**
 *
 * IF ABE TAG SINGLE (NOT ABE EACH STATEMENT)
 * 
 * THIS:
<img src="{{abe type='image' key='image_key' tab='default'}}" alt="">

 * BECOME:
<img data-abe-attr-image_key="src" data-abe-image_key="image_key" data-abe-attr-image_key="src"
data-abe-image_key="image_key" src="{{abe type='image' key='image_key' tab='default' has-abe=1 has-abe=1}}" alt="">

 *
 * IF ABE EACH TAG
 * THIS:
{{#each test}}
  <img src="{{abe type='image' key='test.img' desc='test_img' tab='default'}}" alt="">
{{/each}}

 * BECOME:
{{#each test}}
  <img data-abe-attr-test[index].img="src" data-abe-test[index].img="test[index].img" src="{{abe type='image' key='test.img' desc='test_img' tab='default' has-abe=1}}" alt="">
{{/each}}

 * @param {[type]} template [description]
 */
export function addAbeDataAttrForHtmlAttributes(template) {
  var text = template.replace(/<([A-Za-z]+)/g, '\nABE_SPLIT<$1')
  let abeTagIntoAttribute = text.match(cmsData.regex.abeAsAttributePattern)

  if (abeTagIntoAttribute != null) {
    Array.prototype.forEach.call(abeTagIntoAttribute, (abeIntoTag) => {
      let matchAbeTag = /({{abe.*?[\s\S].*?}})/g.exec(abeIntoTag)

      if(matchAbeTag != null && matchAbeTag[1] != null) {
        var toReplace = cmsTemplates.prepare.getAbeAttributeData(matchAbeTag[1], text, (abeIntoTag.split('=')[0]).trim(), abeIntoTag)

        toReplace = toReplace.replace(
          cmsData.regex.escapeTextToRegex(matchAbeTag[1]),
          cmsTemplates.prepare.addHasAbeAttr(matchAbeTag[1])
        )

        text = text.replace(
          cmsData.regex.escapeTextToRegex(abeIntoTag),
          toReplace
        )
      }
    })
  }
  text = text.replace(/\nABE_SPLIT</g, '<')

  return text
}

/**
 * Example:
 *
 *
 * THIS:
{{abe type='data' key='data_key' source='select title from article' display='title' editable='true' tab='default'}}

{{#each data_key}}
  {{title}}
{{/each}}

 *
 * BECOME THIS

{{abe type='data' key='data_key' source='select title from article' display='title' editable='true' tab='default'}}

{{#each data_key}}
  {{title}}
{{/each}}<!-- [[data_key]] %7B%7B%23each%20data_key%7D%7D%0A%09%7B%7Btitle%7D%7D%0A%7B%7B/each%7D%7D -->

 * @param {[type]} template [description]
 * @param {[type]} json     [description]
 */
export function addAbeSourceComment(template, json) {

  if(typeof json.abe_source !== 'undefined' && json.abe_source !== null) {
    var keys = Object.keys(json.abe_source)
    
    for(var i in keys) {
      var replaceEach = new RegExp(`<!-- \\[\\[${keys[i]}\\]\\][\\s\\S]*?-->`, 'g')
      template = template.replace(replaceEach, '')

      var patAttrSource = new RegExp(' ([A-Za-z0-9\-\_]+)=["|\'].*?({{' + keys[i] + '}}).*?["|\']', 'g')
      var patAttrSourceMatch = template.match(patAttrSource)

      if(patAttrSourceMatch != null) {
        let checkEscapedRegex = /["|'](.*?)["|']/
        let patAttrSourceInside = new RegExp('(\\S+)=["\']?((?:.(?!["\']?\\s+(?:\\S+)=|[>"\']))+.)["\']?({{' + keys[i] + '}}).*?["|\']', 'g')
        Array.prototype.forEach.call(patAttrSourceMatch, (pat) => {
          let patAttrSourceCheck = patAttrSourceInside.exec(pat)
          if(patAttrSourceCheck != null) {
            
            let checkEscaped = checkEscapedRegex.exec(patAttrSourceCheck[0])
            if(checkEscaped != null && checkEscaped.length > 0) {
              checkEscaped = escape(checkEscaped[1])
              template = template.replace(
                patAttrSourceCheck[0],
                ` data-abe-attr="${patAttrSourceCheck[1]}" data-abe-attr-escaped="${checkEscaped}" data-abe="${keys[i]}" ${patAttrSourceCheck[0]}`
              )
            }
          }
        })
      }

      let blocks = cmsTemplates.prepare.splitEachBlocks(template)      
      if(typeof blocks !== 'undefined' && blocks !== null) {
        Array.prototype.forEach.call(blocks, (block) => {
          var textEachWithIndex = block.replace(/(<(?![\/])[A-Za-z0-9!-]*)/g, '$1 data-abe-block="' + keys[i] + '{{@index}}"')
          template = template.replace(block, `${textEachWithIndex}<!-- [[${keys[i]}]] ${cmsTemplates.encodeAbeTagAsComment(block)} -->`)
        })
      }
    }
  }

  return template
}

/**
 * THIS:
<span>{{abe type='text' key='text_visible'}}</span>

 * BECOME:
<span><abe>{{abe type='text' key='text_visible'}}</abe></span>

 * @param {[type]} template [description]
 */
export function addAbeHtmlTagBetweenAbeTags(template) {
  var match
  var templateNoDom = striptags(template)
  while (match = cmsData.regex.abeAsTagPattern.exec(templateNoDom)) {
    template = template.replace(cmsData.regex.escapeTextToRegex(match[1], 'g'), '<abe>' + match[1].trim() + '</abe>')
  }

  return template
}

/**
 * THIS:
[index].

 * BECOME:
{{@index}}-

 *  @param  {[type]} template [description]
 * @return {[type]}          [description]
 */
export function replaceAbeEachIndex(template) {
  return template.replace(/\[index\]\./g, '{{@index}}-')
}

export function removeHiddenAbeTag(template) {
  return template.replace(/(\{\{abe.*visible=[\'|\"]false.*\}\})/g, '')
}

/**
 * Remove {{abe type=*}} from html if attribute visible="false"
 * @param  {[type]} template [description]
 * @return {[type]}          [description]
 */
export function removeHandlebarsRawFromHtml(template) {
  return template.replace(/\{\{\{\{\/?raw\}\}\}\}/g, '')
}

/**
 * split {{#each}}...{{/each}} into an array
 * 
 * @param  {[type]} template [description]
 * @return {[type]}          [description]
 */
export function splitEachBlocks(template) {
  var block
  var blocks = []

  while (block = cmsData.regex.blockPattern.exec(template)) {
    blocks.push(block[1])
  }

  return blocks
}

export function indexEachBlocks(template, onlyHtml) {
  var blocks = cmsTemplates.prepare.splitEachBlocks(template)

  Array.prototype.forEach.call(blocks, (block) => {
    var key = block.match(/#each (.*)\}\}/)[1]
    var match

    // Pour chaque tag Abe
    while (match = cmsData.regex.abeTag.exec(block)) {
      template = cmsTemplates.prepare.addAbeDictionnary(template, match[0], key)
    } 
  })

  return template
}

/**
 * split {{#each}}...{{/each}} into an array
 *
 * THIS:
  {{abe type='text' key='test.title' desc='test title' tab='default'}}

 * BECOME THIS:
  {{abe dictionnary='test' type='text' key='test.title' desc='test title' tab='default'}}

 * 
 * @param  {[type]} template [description]
 * @return {[type]}          [description]
 */
export function addAbeDictionnary(template, match, key) {
  if(cmsData.regex.isEachStatement(match)) return

  if(cmsData.regex.isBlockAbe(match)){
    var abeDictionnary = match.replace(new RegExp('(key=[\'|"])' + key + '.', 'g'), '$1' + key + '[index].')
                               .replace(/\{\{abe/, '{{abe dictionnary=\'' + key + '\'')

    template = template.replace(match, abeDictionnary)
  }

  return template
}