# {{ Template Gauge Card }}

## Description

This card has the same look and feel as the default [Gauge card](https://www.home-assistant.io/dashboards/gauge/), but the majority of the fields can, independently, be provided with a (templatable) value. Additionally, it is possible to have a different `value` and `valueText`, to (for example) create your own version of the [Grid neutrality gauge ](https://www.home-assistant.io/dashboards/energy/#grid-neutrality-gauge).

![image](https://github.com/user-attachments/assets/669e4ae8-7f94-4389-bd3c-907287605d47)


## Configuration variables

| Name                  | Type            | Default  | Description                                                                                                                                    |
| :-------------------- | :-------------- | :------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`              | string          | Optional | Entity for template and actions                                                                                                                |
| `value`               | string          | Optional | Value for graph. May contain [templates](https://www.home-assistant.io/docs/configuration/templating/). Needs to result in a `number`.         |
| `valueText`           | string          | Optional | Text for graph. May contain [templates](https://www.home-assistant.io/docs/configuration/templating/).                                         |
| `name`                | string          | Optional | Name of gauge entity, displayed beneath graph. May contain [templates](https://www.home-assistant.io/docs/configuration/templating/).          |
| `min`                 | string          | Optional | Minimum value for graph. May contain [templates](https://www.home-assistant.io/docs/configuration/templating/). Needs to result in a `number`. |
| `max`                 | string          | Optional | Maximum value for graph. May contain [templates](https://www.home-assistant.io/docs/configuration/templating/). Needs to result in a `number`. |
| `needle`              | boolean         | `false`  | Show the gauge as a needle gauge. Required to be set to true, if using segments.                                                               |
| `tap_action`          | action          | `none`   | Home assistant action to perform on tap                                                                                                        |
| `hold_action`         | action          | `none`   | Home assistant action to perform on hold                                                                                                       |
| `double_tap_action`   | action          | `none`   | Home assistant action to perform on double_tap                                                                                                 |
| `entity_id`           | `string` `list` | Optional | Only reacts to the state changes of these entities. This can be used if the automatic analysis fails to find all relevant entities.            |

## Installation

### HACS

Template Gauge Card is not yet available in HACS. Soon a request to be accepted will be created.  In the meantime, this repo can be added as [`custom repository`](https://www.hacs.xyz/docs/faq/custom_repositories/).


### Manual

1. Download `template-gauge-card.js` file from the [latest release][release-url].
2. Put `template-gauge-card.js` file into your `config/www` folder.
3. Add reference to `template-gauge-card.js` in Dashboard. There's two way to do that:
   - **Using UI:** _Settings_ → _Dashboards_ → _More Options icon_ → _Resources_ → _Add Resource_ → Set _Url_ as `/local/template-gauge-card.js.js` → Set _Resource type_ as `JavaScript Module`.
     **Note:** If you do not see the Resources menu, you will need to enable _Advanced Mode_ in your _User Profile_
   - **Using YAML:** Add following code to `lovelace` section.
     ```yaml
     resources:
       - url: /local/template-gauge-card.js.js
         type: module
     ```

### Translations

If you want to help translating Template Gauge Card, feel free to create an [issue](https://github.com/benjamin-dcs/template-gauge-card/issues) or fork this repo and create an pull-request.


## Support
<a href="https://www.buymeacoffee.com/benjamindcs" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>


## Credits

This card uses some of the core functionality from [Mushroom](https://github.com/piitaya/lovelace-mushroom/)
