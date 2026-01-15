import { Subject, ClassLevel } from '../types';

export interface DemoChapter {
    id: string;
    title: string;
    subject: Subject;
    classLevel: ClassLevel;
    content: string;
}

export const demoChapters: DemoChapter[] = [
    {
        id: 'phy10_light',
        title: 'Light - Reflection & Refraction',
        subject: Subject.Physics,
        classLevel: 'Class 10',
        content: `
Light is a form of energy that enables us to see. It travels in straight lines. We can see objects when light from them reaches our eyes.

Reflection of Light:
When light falls on a highly polished surface like a mirror, most of the light is sent back into the same medium. This process is called reflection of light.

Laws of Reflection:
1. The angle of incidence is equal to the angle of reflection. (∠i = ∠r)
2. The incident ray, the normal to the mirror at the point of incidence, and the reflected ray, all lie in the same plane.

Spherical Mirrors:
Mirrors whose reflecting surfaces are spherical are called spherical mirrors. There are two types:
1. Concave Mirror: The reflecting surface is curved inwards. It can form real, inverted images as well as virtual, erect images.
2. Convex Mirror: The reflecting surface is curved outwards. It always forms a virtual, erect, and diminished image.

Important Terms for Spherical Mirrors:
- Pole (P): The center of the reflecting surface of a spherical mirror.
- Center of Curvature (C): The center of the sphere of which the mirror is a part.
- Radius of Curvature (R): The radius of the sphere of which the mirror is a part. R = 2f.
- Principal Axis: The straight line passing through the pole and the center of curvature.
- Principal Focus (F): A point on the principal axis where rays of light parallel to the principal axis converge (concave mirror) or appear to diverge from (convex mirror) after reflection.
- Focal Length (f): The distance between the pole and the principal focus.

Mirror Formula:
The relationship between the object distance (u), image distance (v), and focal length (f) is given by the mirror formula:
1/v + 1/u = 1/f

Magnification (m):
It is the ratio of the height of the image (h') to the height of the object (h).
m = h'/h = -v/u

Refraction of Light:
The bending of light when it enters obliquely from one transparent medium to another is called refraction of light. This happens because the speed of light is different in different media.

Laws of Refraction:
1. The incident ray, the refracted ray, and the normal to the interface of two transparent media at the point of incidence, all lie in the same plane.
2. Snell's Law: The ratio of the sine of the angle of incidence to the sine of the angle of refraction is a constant, for the light of a given color and for the given pair of media. This constant is called the refractive index.
sin(i) / sin(r) = constant = n₂₁

Refractive Index (n):
The refractive index of a medium gives an indication of the light-bending ability of that medium. n = c/v, where c is the speed of light in vacuum and v is the speed of light in the medium.

Spherical Lenses:
A transparent material bound by two surfaces, of which one or both surfaces are spherical, forms a lens.
1. Convex Lens: Thicker at the center and thinner at the edges. It is a converging lens.
2. Concave Lens: Thinner at the center and thicker at the edges. It is a diverging lens.

Lens Formula:
1/v - 1/u = 1/f

Power of a Lens (P):
The degree of convergence or divergence of light rays achieved by a lens. It is the reciprocal of its focal length. P = 1/f. The SI unit of power is dioptre (D).
        `
    },
    {
        id: 'bio9_cell',
        title: 'The Fundamental Unit of Life - Cell',
        subject: Subject.Biology,
        classLevel: 'Class 9',
        content: `
Introduction to Cells:
All living organisms are made up of fundamental units called cells. The cell is the basic structural and functional unit of life. Robert Hooke discovered cells in 1665 while observing a thin slice of cork under a microscope.

The Cell Theory:
Proposed by Schleiden and Schwann, and later expanded by Virchow, the cell theory states that:
1. All plants and animals are composed of cells.
2. The cell is the basic unit of life.
3. All cells arise from pre-existing cells.

Types of Organisms:
- Unicellular Organisms: Single-celled organisms like Amoeba, Paramecium, and bacteria. A single cell performs all life functions.
- Multicellular Organisms: Organisms made of many cells, like humans, plants, and animals. Different cells are specialized to perform different functions.

Structure of a Cell:
A typical cell has three main components:
1. Plasma Membrane (or Cell Membrane): The outermost covering of the cell that separates the contents of the cell from its external environment. It is a selectively permeable membrane, which means it allows the entry and exit of only some materials. It is made up of lipids and proteins.
2. Nucleus: The "brain" of the cell. It is a large, spherical organelle usually located in the center of the cell. It has a double-layered covering called the nuclear membrane. The nucleus contains chromosomes, which are composed of DNA and proteins. DNA contains the genetic information for the cell.
3. Cytoplasm: The jelly-like substance present between the cell membrane and the nucleus. It contains various specialized cell organelles, each performing a specific function for the cell.

Cell Organelles:
- Endoplasmic Reticulum (ER): A large network of membrane-bound tubes and sheets. It functions as a channel for the transport of materials. There are two types: Rough ER (RER) with ribosomes, and Smooth ER (SER). RER helps in protein synthesis, while SER helps in manufacturing fats and lipids.
- Golgi Apparatus: Consists of a system of membrane-bound vesicles arranged parallel to each other in stacks called cisterns. It is involved in the storage, modification, and packaging of products in vesicles.
- Lysosomes: Known as the "suicide bags" of the cell. They are small, spherical sacs containing powerful digestive enzymes. They help to keep the cell clean by digesting any foreign material as well as worn-out cell organelles.
- Mitochondria: Known as the "powerhouses" of the cell. They have two membrane coverings. They generate energy in the form of ATP (Adenosine Triphosphate) molecules, which is the energy currency of the cell.
- Plastids: Present only in plant cells. There are two types: Chromoplasts (colored plastids) and Leucoplasts (white or colorless plastids). Chloroplasts are plastids containing chlorophyll, and they perform photosynthesis.
- Vacuoles: Storage sacs for solid or liquid contents. They are small-sized in animal cells while plant cells have very large vacuoles.

Differences between Plant and Animal Cells:
- Plant cells have a cell wall outside the plasma membrane, which is absent in animal cells.
- Plant cells have large central vacuoles, while animal cells have small or no vacuoles.
- Plant cells have plastids, which are absent in animal cells.
        `
    }
];
