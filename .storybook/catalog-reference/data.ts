import type { PortalLocale } from "../../src/i18n/routing";
import { dictionaries } from "../fixtures";

export type ReferenceDataset = {
  ref: string;
  name: string;
  product: string;
  description: string;
  background?: string;
  region: string;
  geography: string;
  year?: string;
  unit?: string;
  open: boolean;
  technology?: string;
  included?: string;
  excluded?: string;
  exchanges: {
    name: string;
    direction: "input" | "output";
    amount: string;
    unit: string;
    reference?: boolean;
  }[];
};

// Deliberately synthetic identities and authored example values. Never send these to public APIs.
const names: Record<PortalLocale, string[]> = {
  "zh-CN": [
    "交流电生产 · 高压电力消费组合",
    "交流电生产 · 全国电网组合",
    "燃煤发电 · 超临界机组",
    "陆上风力发电 · 区域风电组合",
    "光伏发电 · 单晶硅组件",
    "城市固体废弃物处理 · 卫生填埋",
    "交流电生产 · 区域电网组合",
    "交流电生产 · 工业园区供电",
  ],
  en: [
    "Electricity supply · high-voltage consumption mix",
    "Electricity supply · national grid mix",
    "Coal-fired electricity · supercritical unit",
    "Onshore wind electricity · regional mix",
    "Photovoltaic electricity · monocrystalline modules",
    "Municipal solid waste treatment · sanitary landfill",
    "Electricity supply · regional grid mix",
    "Electricity supply · industrial park",
  ],
  de: [
    "Stromversorgung · Hochspannungs-Verbrauchsmix",
    "Stromversorgung · nationaler Strommix",
    "Kohlestrom · überkritisches Kraftwerk",
    "Onshore-Windstrom · regionaler Windkraftmix",
    "Photovoltaikstrom · monokristalline Module",
    "Siedlungsabfallbehandlung · geordnete Deponierung",
    "Stromversorgung · regionaler Strommix",
    "Stromversorgung · Industriepark",
  ],
  fr: [
    "Électricité · mix de consommation à haute tension",
    "Électricité · mix du réseau national",
    "Électricité au charbon · unité supercritique",
    "Électricité éolienne terrestre · mix régional",
    "Électricité photovoltaïque · modules monocristallins",
    "Déchets municipaux · mise en décharge contrôlée",
    "Électricité · mix du réseau régional",
    "Électricité · parc industriel",
  ],
};
const descriptions: Record<PortalLocale, string[]> = {
  "zh-CN": [
    "安徽省高压电网终端消耗的平均电力组合，包含发电背景、输配电损失与相关基础设施。",
    "全国电网的平均电力生产组合，覆盖不同发电技术的供给。",
    "超临界燃煤机组的电力生产，包含燃料供应与电厂运行。",
    "陆上风电机组的电力生产，包含设备制造、建设与运行维护。",
    "单晶硅光伏系统的电力生产，包含组件制造与电站运行。",
    "生活垃圾卫生填埋过程；原始说明涉及渗滤液处理的电力消耗。",
    "区域电网的电力生产组合；该记录仅公开元数据。",
    "工业园区终端使用的电力。原始记录未提供完整的时间与技术范围。",
  ],
  en: [
    "Average electricity consumed from Anhui's high-voltage grid, including generation, transmission losses and associated infrastructure.",
    "Average electricity production for the national grid, covering supply from different generation technologies.",
    "Electricity from a supercritical coal-fired unit, including fuel supply and plant operation.",
    "Electricity from onshore wind turbines, including manufacturing, construction and maintenance.",
    "Electricity from a monocrystalline photovoltaic system, including module manufacturing and operation.",
    "Sanitary landfill of household waste; the source description includes electricity consumed in leachate treatment.",
    "Electricity production mix for a regional grid; only metadata is public for this record.",
    "Electricity consumed in an industrial park. The source does not provide a complete time or technical scope.",
  ],
  de: [
    "Durchschnittlich verbrauchter Strom aus Anhuis Hochspannungsnetz, einschließlich Erzeugung, Übertragungsverlusten und zugehöriger Infrastruktur.",
    "Durchschnittliche Stromerzeugung für das nationale Netz aus verschiedenen Erzeugungstechnologien.",
    "Strom aus einem überkritischen Kohlekraftwerk, einschließlich Brennstoffversorgung und Betrieb.",
    "Strom aus Onshore-Windanlagen, einschließlich Herstellung, Bau und Wartung.",
    "Strom aus einer monokristallinen Photovoltaikanlage, einschließlich Modulherstellung und Betrieb.",
    "Geordnete Deponierung von Hausmüll; die Quellbeschreibung enthält den Stromverbrauch der Sickerwasserbehandlung.",
    "Stromerzeugungsmix eines regionalen Netzes; für diesen Datensatz sind nur Metadaten öffentlich.",
    "Stromverbrauch in einem Industriepark. Die Quelle enthält keinen vollständigen zeitlichen oder technischen Umfang.",
  ],
  fr: [
    "Électricité moyenne consommée sur le réseau à haute tension de l’Anhui, comprenant la production, les pertes de transport et les infrastructures associées.",
    "Production moyenne d’électricité du réseau national, couvrant plusieurs technologies de production.",
    "Électricité d’une unité au charbon supercritique, incluant l’approvisionnement en combustible et l’exploitation.",
    "Électricité d’éoliennes terrestres, incluant la fabrication, la construction et la maintenance.",
    "Électricité d’un système photovoltaïque monocristallin, incluant la fabrication des modules et l’exploitation.",
    "Mise en décharge contrôlée des déchets ménagers ; la description source mentionne l’électricité consommée par le traitement des lixiviats.",
    "Mix de production d’électricité d’un réseau régional ; seules les métadonnées sont publiques pour cet enregistrement.",
    "Électricité consommée dans un parc industriel. La source ne fournit pas de périmètre temporel ou technique complet.",
  ],
};
const regions: Record<PortalLocale, string[]> = {
  "zh-CN": ["中国，安徽", "中国", "中国，山西", "中国，内蒙古", "中国，江苏", "中国，贵州"],
  en: [
    "China, Anhui",
    "China",
    "China, Shanxi",
    "China, Inner Mongolia",
    "China, Jiangsu",
    "China, Guizhou",
  ],
  de: [
    "China, Anhui",
    "China",
    "China, Shanxi",
    "China, Innere Mongolei",
    "China, Jiangsu",
    "China, Guizhou",
  ],
  fr: [
    "Chine, Anhui",
    "Chine",
    "Chine, Shanxi",
    "Chine, Mongolie-Intérieure",
    "Chine, Jiangsu",
    "Chine, Guizhou",
  ],
};
const scope: Record<PortalLocale, [string, string, string]> = {
  "zh-CN": [
    "区域平均消费组合；高压输配电（35–330 kV）。",
    "发电背景、输配电损失、变压器及电缆的建设和运行。",
    "终端用电设备的制造与使用。",
  ],
  en: [
    "Regional average consumption mix; high-voltage transmission (35–330 kV).",
    "Generation background, transmission losses, transformer and cable construction and operation.",
    "Manufacture and use of end-user electrical equipment.",
  ],
  de: [
    "Regionaler durchschnittlicher Verbrauchsmix; Hochspannungsübertragung (35–330 kV).",
    "Erzeugungshintergrund, Übertragungsverluste, Bau und Betrieb von Transformatoren und Kabeln.",
    "Herstellung und Nutzung elektrischer Endgeräte.",
  ],
  fr: [
    "Mix de consommation régional moyen ; transport à haute tension (35–330 kV).",
    "Production en amont, pertes de transport, construction et exploitation des transformateurs et câbles.",
    "Fabrication et utilisation des équipements électriques finaux.",
  ],
};

export function referenceDatasets(locale: PortalLocale): ReferenceDataset[] {
  const regionCodes = ["CN-AH", "CN", "CN-SX", "CN-NM", "CN-JS", "CN-GZ"];
  const product = {
    "zh-CN": "交流电",
    en: "Electricity, AC",
    de: "Wechselstrom",
    fr: "Électricité, courant alternatif",
  }[locale];
  return names[locale].map((name, index) => {
    const digit = String(index + 1);
    const geographyIndex = index < 6 ? index : 0;
    return {
      ref: `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-8${digit.repeat(3)}-${digit.repeat(12)}@01.01.002`,
      name,
      description: descriptions[locale][index]!,
      background:
        index === 0
          ? {
              "zh-CN":
                "这一示例描述终端用户从安徽省高压电网取得的平均电力。其上游为区域发电组合，随后纳入输配电损失以及相关设施的建设和运行。研究对象如使用其他电压等级、地区或年份，应先核对这些条件是否一致。",
              en: "This example describes the average electricity drawn by end users from Anhui's high-voltage grid. A regional generation mix supplies the upstream system, followed by transmission losses and infrastructure construction and operation. Check the voltage level, geography and year against those of the intended study.",
              de: "Dieses Beispiel beschreibt den durchschnittlichen Strombezug aus Anhuis Hochspannungsnetz. Ein regionaler Erzeugungsmix bildet das vorgelagerte System; Übertragungsverluste sowie Bau und Betrieb der Infrastruktur werden einbezogen. Gleichen Sie Spannungsebene, Region und Jahr mit der geplanten Studie ab.",
              fr: "Cet exemple décrit l’électricité moyenne prélevée par les utilisateurs sur le réseau à haute tension de l’Anhui. Le système amont repose sur un mix de production régional, auquel s’ajoutent les pertes de transport et les infrastructures. Vérifiez la tension, la région et l’année par rapport à l’étude envisagée.",
            }[locale]
          : undefined,
      product: index === 5 ? name : product,
      region: regionCodes[geographyIndex]!,
      geography: regions[locale][geographyIndex]!,
      year: index === 7 ? undefined : index === 6 ? "2020" : index === 2 ? "2023" : "2022",
      unit: index === 7 ? undefined : index === 5 ? "1 kg" : index === 0 ? "3.6 MJ" : "1 kWh",
      open: ![5, 6, 7].includes(index),
      technology:
        index === 7 ? undefined : index === 0 ? scope[locale][0] : descriptions[locale][index],
      included: index === 0 ? scope[locale][1] : undefined,
      excluded: index === 0 ? scope[locale][2] : undefined,
      exchanges:
        index === 0
          ? [
              { name: names[locale][1]!, direction: "input", amount: "1.060000", unit: "kWh" },
              { name: product, direction: "output", amount: "3.6", unit: "MJ", reference: true },
            ]
          : [],
    };
  });
}

export function referenceCitation(record: ReferenceDataset, locale: PortalLocale) {
  return `${dictionaries[locale].CatalogReference.sampleSource}. ${record.name}. ${record.year ?? dictionaries[locale].Common.notProvided}. ${record.ref}.`;
}
