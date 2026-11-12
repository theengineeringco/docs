# Electric vehicle reference project

The worked example for every product page. It follows the team's standard demo
project. Values are illustrative and internally consistent; keep them that way.
If a page needs a new record, add it here first, then use it.

## Systems (product breakdown structure)

```
Vehicle
├── Body & Aerodynamics
├── Powertrain
│   ├── Drive Unit
│   └── Inverter
├── Battery System
│   ├── Battery Pack
│   └── Battery Management System (BMS)
└── Charging System
```

Owners, by role:

| System | Owner |
| --- | --- |
| Vehicle | Vehicle lead engineer |
| Body & Aerodynamics | Aerodynamics engineer |
| Powertrain | Powertrain engineer |
| Battery System | Battery systems engineer |
| Battery Management System | BMS software engineer (owns the firmware) |
| Charging System | Charging engineer |

## Requirements

Decomposition, the demo's opening thread:

```
Top Speed                       ≥ 180 km/h           Vehicle
├── Aerodynamic Drag Coefficient ≤ 0.28 (Cd)         Body & Aerodynamics
│   └── Frontal Area            ≤ 2.4 m²             Body & Aerodynamics
└── Powertrain Peak Torque      ≥ 420 N·m            Powertrain
```

Other requirements used across pages:

| Requirement | Value | System |
| --- | --- | --- |
| Range, WLTP | ≥ 480 km | Vehicle |
| Battery Usable Capacity | ≥ 100 kWh | Battery Pack |
| Cell Temperature During DC Fast Charging | 15 °C to 45 °C | Battery Management System |
| DC Fast Charge Time, 10–80% | ≤ 30 min | Charging System |

Statement form: "The vehicle shall have an aerodynamic drag coefficient no greater
than 0.28, measured by coastdown in its delivered configuration."

## Verification thread

| Record | Category | Detail |
| --- | --- | --- |
| Coastdown Test | Test Case | Test-track coastdown, delivered configuration, derives Cd |
| Aerodynamic Verification | Test Plan | Groups the coastdown and wind-tunnel test cases |
| Coastdown Procedure | Document | Track, conditions, equipment, method |
| Coastdown: Prototype Build 1 | Test Result | Cd 0.296 |
| Coastdown: Prototype Build 2 | Test Result | Cd 0.287 |
| Coastdown: Prototype Build 3 | Test Result | Cd 0.279, passes |

Each result is its own record. Builds 1 and 2 missed the target; Build 3 meets it.
Averaging them does not describe the vehicle.

## Branches

Variants (lasting differences):

```
Base           shared standards, regulations, common requirements
├── Coupe
├── Truck      overrides Cd target to ≤ 0.35; adds towing requirements
└── SUV
```

Proposals on Truck, developed in parallel:

- **Battery capacity trade study**: Battery Usable Capacity 100 → 120 kWh. Touches
  range, vehicle mass, and DC fast charge time.
- **BMS improvements**: revised thermal management in the BMS.
- **DC fast charging**: adds the fast-charging feature and its requirements.

## The firmware review (agents and integrations)

The BMS software engineer opens a pull request in GitHub that changes the battery
thermal limits in firmware to −5 °C and 30 °C. Flow's review on the pull request:

- finds the affected requirement, Cell Temperature During DC Fast Charging
  (15 °C to 45 °C), and flags the mismatch;
- suggests the traceability links the change is missing;
- names the people who resolve it: the BMS software engineer, who owns the code, and
  the battery systems engineer, who owns the requirement.

Grounded on `master`: automations can trigger on GitHub pull request review events.
Describe the outcome, not internal trigger names.

## Saved views

A project can save perspectives such as **Systems**, **Functions**, **Verification**,
and **Risks**. They show the same records for different tasks.
