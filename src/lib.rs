mod utils;

use std::{cell, ops::Index, thread::sleep, fmt};

use fixedbitset::FixedBitSet;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(name);
}

// #[wasm_bindgen]
// #[repr(u8)]
// #[derive(Clone, Copy, Debug, PartialEq, Eq)]
// pub enum Cell {
//     Dead = 0,
//     Alive = 1,
// }

#[wasm_bindgen]
pub struct Universe {
    width: usize,
    height: usize,
    cells: FixedBitSet,
}
#[wasm_bindgen]
impl Universe {
    pub fn width(&self) -> usize {
        self.width
    }

    pub fn height(&self) -> usize {
        self.height
    }

    pub fn cells(&self) -> *const u32 {
        self.cells.as_slice().as_ptr()
    }

    pub fn tick(&mut self) {
        // all changes must be applied at once
        let mut next_gen = self.cells.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let cell = self.is_alive(row, col);
                let neighbour_count = self.live_neighbour_count(row, col);

                let next_cell = match (cell, neighbour_count) {
                    // Rule 1: Any live cell with fewer than two live neighbours
                    // dies, as if caused by underpopulation.
                    (true, x) if x < 2 => false,
                    // Rule 2: Any live cell with two or three live neighbours
                    // lives on to the next generation.
                    (true, 2) | (true, 3) => true,
                    // Rule 3: Any live cell with more than three live
                    // neighbours dies, as if by overpopulation.
                    (true, x) if x > 3 => false,
                    // Rule 4: Any dead cell with exactly three live neighbours
                    // becomes a live cell, as if by reproduction.
                    (false, 3) => true,
                    // All other cells remain in the same state.
                    (otherwise, _) => otherwise,
                };

                next_gen.set(self.get_offset(row, col), next_cell);
            }
        }

        self.cells = next_gen;
    }

    pub fn new() -> Self {
        utils::set_panic_hook();
        let width = 128;
        let height = 128;
            
        println!("here");
        let mut cells = FixedBitSet::with_capacity(width * height);
        (0..width * height).for_each(|i| {
            cells.set(i, i % 2 == 0 || i % 7 == 0)
        });


        Universe {
            width,
            height,
            cells,
        }
    }

    pub fn toggle_cell(&mut self, row: usize, col: usize) {
        self.cells.toggle(self.get_offset(row, col));
    }
}
impl Universe {
    fn is_alive(&self, row: usize, col: usize) -> bool {
        self.cells.contains(self.get_offset(row, col))
    }

    fn get_offset(&self, row: usize, col: usize) -> usize {
        self.width * row  + col
    }

    fn live_neighbour_count(&self, row: usize, col: usize) -> u8 {
        let mut count = 0;

        for i in -1..=1 {
            for j in -1..=1 {
                // ignore self, and out-of-bounds
                if i == 0 && j == 0 {continue;}
                if self.is_alive((row as i32 + i) as usize, (col as i32 + j) as usize) {count += 1;}
            }
        }
        
        count
    }
}
impl fmt::Display for Universe {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for line in self.cells.as_slice().chunks(self.width as usize) {
            for &cell in line {
                let symbol = if cell == 0b1 { '◻' } else { '◼' };
                write!(f, "{}", symbol)?;
            }
            write!(f, "\n")?;
        }

        Ok(())
    }
}