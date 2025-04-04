# Energy Grid Neutrality Gauge
![image](https://github.com/user-attachments/assets/80c7b7e7-44a6-4af6-af2f-48b0f3d9f002)

```yaml
type: custom:template-gauge-card
value: |-
  {% set consumedFromGrid =
    states('sensor.p1_meter_energy_import_tariff_1_daily') | float
    +
    states('sensor.p1_meter_energy_import_tariff_2_daily') | float
  %}

  {% set returnedToGrid =
    states('sensor.p1_meter_energy_export_tariff_1_daily') | float
    +
    states('sensor.p1_meter_energy_export_tariff_2_daily') | float
  %}

  {% if returnedToGrid > consumedFromGrid %}
    {{ 1 - consumedFromGrid / returnedToGrid }}
  {% else %}
    {{ (1 - returnedToGrid / consumedFromGrid) * -1 }}
  {% endif %}
valueText: |-
  {% set consumedFromGrid =
    states('sensor.p1_meter_energy_import_tariff_1_daily') | float
    +
    states('sensor.p1_meter_energy_import_tariff_2_daily') | float
  %}

  {% set returnedToGrid =
    states('sensor.p1_meter_energy_export_tariff_1_daily') | float
    +
    states('sensor.p1_meter_energy_export_tariff_2_daily') | float
  %}


  {{ (returnedToGrid - consumedFromGrid) | round(2) | replace('.', ',') }} kWh
name: |-
  {% set consumedFromGrid =
    states('sensor.p1_meter_energy_import_tariff_1_daily') | float
    +
    states('sensor.p1_meter_energy_import_tariff_2_daily') | float
  %}

  {% set returnedToGrid =
    states('sensor.p1_meter_energy_export_tariff_1_daily') | float
    +
    states('sensor.p1_meter_energy_export_tariff_2_daily') | float
  %}

  {% if returnedToGrid > consumedFromGrid %}
    It's sunny outside!
  {% else %}
    Brrr!
  {% endif %}
min: "-1"
max: "1"
needle: true
segments:
  - from: -1
    color: var(--red-color)
  - from: 0
    color: var(--light-green-color)
```
