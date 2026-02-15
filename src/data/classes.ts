/**
 * LoL champion subclasses (Riot's class + subclass framework).
 * Parent classes and their subclasses per the champion wiki.
 */
export const CHAMPION_CLASSES = [
    "Enchanter",
    "Catcher",
    "Juggernaut",
    "Diver",
    "Burst",
    "Battlemage",
    "Artillery",
    "Marksman",
    "Assassin",
    "Skirmisher",
    "Vanguard",
    "Warden",
    "Specialist",
] as const;

export type ChampionClass = (typeof CHAMPION_CLASSES)[number];

/** Parent class (e.g. Mage) and its subclasses for grouped UI. */
export const CLASS_GROUPS: readonly {
    parent: string;
    subclasses: readonly ChampionClass[];
}[] = [
    { parent: "Controller", subclasses: ["Enchanter", "Catcher"] },
    { parent: "Fighter", subclasses: ["Juggernaut", "Diver"] },
    { parent: "Mage", subclasses: ["Burst", "Battlemage", "Artillery"] },
    { parent: "Marksman", subclasses: ["Marksman"] },
    { parent: "Slayer", subclasses: ["Assassin", "Skirmisher"] },
    { parent: "Tank", subclasses: ["Vanguard", "Warden"] },
    { parent: "Specialist", subclasses: ["Specialist"] },
];

/** Official subclass descriptions from the League of Legends wiki (Champion classes). */
export const CLASS_DESCRIPTIONS: Record<ChampionClass, string> = {
    Enchanter:
        "Enchanters focus on amplifying their allies' effectiveness by directly augmenting them and defending them from incoming threats. They are often quite fragile and bring relatively low damage, and only shine when grouped with others.",
    Catcher:
        "Catchers specialize in locking down opponents or entire battlefields by creating intense zones of threat. Although not as reliant on their friends as Enchanters, fragile Catchers greatly benefit from allied presence to deter danger and capitalize on locked-down targets.",
    Juggernaut:
        "Juggernauts are Fighters with high durability and damage output. They are more heavily armored and resilient than other fighter types, making them excellent at absorbing punishment in fights.",
    Diver: "Divers are the more mobile Fighters. They excel at singling out high-priority targets and blitzing toward them, forcing those targets to respond. While not as durable as tanks or juggernauts, they can withstand significant punishment and deal enough damage to be a real threat if left unchecked.",
    Burst: "Burst Mages aim to single out vulnerable targets by locking them down and following up with devastating damage from range. They excel at executing their full suite of spells to maximize effect and are strongest when they can deliver their complete combo.",
    Battlemage:
        "Battlemages get into the middle of combat to wreak havoc with overwhelming sustained area damage. Despite relatively short combat ranges, they have significant defensive capabilities (sustain, defying death), allowing them to burn down opponents over time while staying in the fight.",
    Artillery:
        "Artillery Mages are masters of range, leveraging it to whittle down opponents from great distances over time. They are severely punished when enemies close the gap due to extreme fragility and limited mobility.",
    Marksman:
        "Marksmen are ranged champions whose power revolves almost exclusively around their basic attacks. They use their range to land massive continuous damage from a distance, capable of taking down even tough opponents when positioned correctly behind their team.",
    Assassin:
        "Assassins specialize in infiltrating enemy lines with unrivaled mobility to quickly dispatch high-priority targets. Due to their mostly melee nature they must position dangerously to execute targets, but often have defensive abilities that allow them to avoid incoming damage if used cleverly.",
    Skirmisher:
        "Skirmishers have more survivability than Assassins, allowing them to survive longer in fights. They represent a balance between the pure burst of Assassins and the durability of other classes, with better defensive capabilities for extended combat.",
    Vanguard:
        "Vanguards are offensive tanks that lead the charge. They specialize in explosive team fight initiation to catch enemies out of position, allowing allies to follow up effectively.",
    Warden: "Wardens are defensive tanks that stand steadfast to hold the line. They persistently lock down anyone attempting to pass them and keep their allies out of harm's way.",
    Specialist:
        "Specialists are champions who do not fit neatly into other class or subclass specifications. Many exhibit zone control as either a dominant or secondary attribute.",
};

export function isChampionClass(s: string): s is ChampionClass {
    return CHAMPION_CLASSES.includes(s as ChampionClass);
}
