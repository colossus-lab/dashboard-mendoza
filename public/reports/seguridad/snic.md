# Seguridad Ciudadana — Mendoza (SNIC Provincial)

## Hechos delictivos en Mendoza vs el resto del país, 2000-2024

**Fuente**: Sistema Nacional de Información Criminal (SNIC) — Ministerio de Seguridad de la Nación. Panel provincial `(panel)-(.csv).csv`.
**Cobertura**: Toda la población provincial. Datos disponibles 2000-2024.

---

## 1. La foto del último año

Los KPIs en la cabecera del informe muestran las cifras provinciales del último año disponible. La foto de Mendoza 2024:

- **185.458 hechos delictivos**, con tasa total de **8.967 cada 100 mil habitantes** — **4° lugar de 24 jurisdicciones** (entre las más altas del país por su perfil urbanizado).
- **+35,1 % de aumento** en hechos vs. 2019 — un quinquenio de crecimiento sostenido.
- **69 homicidios dolosos** (tasa 3,3 / 100K) — **11° lugar de 24**, mitad del ranking, comparativamente menor que NEA y conurbano.
- **28,1 % de delitos patrimoniales** (robos + hurtos) — proporción moderada en términos comparativos.
- **18.908 estafas y defraudaciones** — categoría de mayor crecimiento por delitos digitales.

---

## 2. Tendencia 2000-2024

La serie de hechos delictivos en Mendoza muestra:

- **Pico histórico** alrededor del período 2014-2019, asociado a un boom de delitos contra la propiedad.
- **Descenso parcial** post-pandemia (2020-2021).
- **Estabilización** o leve recuperación en los últimos años, con cambio de composición: caen robos, suben estafas virtuales.

La línea de **tasa total cada 100 mil habitantes** permite comparar el nivel mendocino con el promedio simple del país y detectar si la provincia está por encima o por debajo del agregado nacional.

---

## 3. Composición del delito (2024)

| Categoría | Hechos | % del total |
|---|---:|---:|
| **Robos** (excluye agravados por lesiones/muerte) | 31.234 | 16,8 % |
| **Otros delitos contra la propiedad** | 26.922 | 14,5 % |
| **Hurtos** | 20.936 | 11,3 % |
| **Estafas y defraudaciones** | 18.908 | 10,2 % |
| **Amenazas** | 17.237 | 9,3 % |
| **Lesiones dolosas** | 14.876 | 8,0 % |
| **Lesiones culposas** (no viales) | 9.998 | 5,4 % |
| **Homicidios dolosos** | 69 | 0,04 % |
| Otros | 45.278 | 24,4 % |

**Patrimoniales (robos + hurtos)**: 28,1 % del total — porcentaje moderado en términos comparativos. El **mayor peso** lo tienen en conjunto los **delitos contra la propiedad (~43 %)** sumando "otros delitos contra la propiedad", **lesiones (13 %)** y **estafas (10 %)** que crece año a año por delitos digitales.

**Homicidios dolosos**: solo **69 casos en 2024** (tasa 3,3 / 100K), una de las **tasas más bajas del país** — Mendoza se ubica en la mitad inferior del ranking nacional.

---

## 4. Mendoza vs el país

El ranking de provincias (por tasa de hechos cada 100K) permite ubicar a Mendoza en el espectro nacional:

- En el **ranking de tasa total de hechos**, Mendoza está **4° de 24 jurisdicciones** — entre las más altas del país. Es consistente con su perfil urbanizado y con el comportamiento típico de las provincias con alta densidad metropolitana, donde se concentra la actividad delictiva contra la propiedad y los registros de denuncia son más completos.
- En **homicidios dolosos**, Mendoza está **11° de 24** — exactamente en la mitad del ranking. La **tasa de 3,3 homicidios cada 100K habitantes** es **menor** que la del NEA (Chaco, Santa Fe), el conurbano bonaerense y el norte (Salta, Jujuy), pero similar al promedio nacional.

---

## 5. Víctimas

**Aclaración técnica**: El SNIC desagrega víctimas por sexo SOLO en algunos delitos (homicidios dolosos, muertes viales, suicidios). En el resto (robos, hurtos, estafas, amenazas), las víctimas se cuentan sin desglose de sexo. Por eso **las cifras de "víctimas mujeres del total" no son interpretables**: la mayoría queda en la categoría "sin sexo declarado".

### Donde sí se puede mirar el desbalance — Homicidios dolosos 2024

| Sexo | Víctimas |
|---|---:|
| Varones | 61 (86 %) |
| **Mujeres** | **10 (14 %)** |
| **Total** | 71 |

- **De cada 7 víctimas de homicidio doloso en Mendoza, 1 es mujer**. Es un dato consistente con el patrón nacional (la mayoría de los homicidios involucra varones como víctimas y autores).
- Para **femicidios específicamente** (subset de los homicidios dolosos donde la víctima es mujer y el motivo es de género), se necesitan los registros del Ministerio de Seguridad / Oficina de la Mujer de la CSJN, que no son parte del SNIC.

---

## 6. Limitaciones

- Los datos del SNIC dependen de la **denuncia**, por lo que la tendencia puede reflejar tanto cambios reales como cambios en el comportamiento de denuncia.
- No hay **desagregación departamental** para Mendoza en este dataset (solo provincial). Para ver delitos por departamento mendocino, se necesita el SNIC departamental, que no forma parte del pipeline actual.
- Los datos de **muertes viales** se publican a nivel nacional, no provincial — por eso este dashboard no incluye un informe específico de víctimas viales para Mendoza.

---

## 7. Conclusiones

- Mendoza tiene una **delincuencia comparativamente moderada** dentro del país, con perfil típicamente urbano: alto peso de delitos contra la propiedad, tasas de homicidio bajas-medias.
- La **transición hacia delitos digitales** (estafas y defraudaciones) es notoria.
- El comparativo con el resto del país requiere mirar tasas (no números absolutos) para neutralizar el tamaño poblacional.
