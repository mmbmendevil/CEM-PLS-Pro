export type ModuleVideoAsset = {
  src: string
  mimeType: 'video/mp4'
  poster?: string
  captions?: string
}

export type ModuleCatalogItem = {
  id: number
  slug: string
  order: number
  title: string
  competencyCode: string
  description: string
  lessonContent?: string
  video: ModuleVideoAsset
}

export const MODULES_CATALOG: ModuleCatalogItem[] = [
  {
    id: 1,
    slug: 'cpu-components',
    order: 1,
    title: 'CPU Components',
    competencyCode: 'CPU',
    description: 'Detailed analysis of CPU building blocks: ALU design, control unit architectures...',
    lessonContent: `Central Processing Unit (CPU)

The Central Processing Unit (CPU) is like the brain of a computer. It is the part that does most of the thinking, calculating, and decision-making to make your computer work. Whether you are playing a game, typing a school assignment, or watching a video, the CPU is busy handling all the instructions to get the job done.

The CPU is usually placed in a special slot called a socket on the computer's motherboard, which is like the main circuit board that connects all the parts of a computer. The CPU handles tasks like:

- Doing math calculations (like adding or multiplying numbers).
- Running apps or games.
- Input/Output (I/O) operations: Communicate with memory and peripherals.
- Storing and retrieving information during tasks.

Main Components of CPU

The components of a CPU include the ALU (Arithmetic Logic Unit), CU (Control Unit), registers, cache, and clock.

- Control Unit: The control unit manages the CPU by sending signals like clock, hold, and reset to its parts. It ensures all components work together to complete tasks. For example, it synchronizes data movement from cache memory to the ALU.
- Arithmetic and Logic Unit (ALU): The ALU handles arithmetic tasks (like addition, subtraction, multiplication, division) and logical tasks (like AND, OR, comparisons). It uses addition for all calculations, e.g., solving 2x3 as 2+2+2=6.
- Memory Unit: The memory unit stores data and instructions. Older CPUs used registers, but modern ones also have fast cache memory. The CPU fetches data from RAM, ROM, or hard disks and stores it in registers or cache during tasks.

Functions of the CPU

The CPU's main job is to process instructions from programs. It does this through a process called the Fetch-Decode-Execute-Store cycle:

- Fetch: first the CPU gets the instruction. That means binary numbers are passed from RAM to CPU.
- Decode: when the instruction enters the CPU, it needs to decode the instruction. With help from the ALU (Arithmetic Logic Unit), decoding begins.
- Execute: after the decode step, the instructions are ready to execute.
- Store: after the execute step, the results are ready to store in memory.

Types of CPUs

CPUs come in different types, depending on how many cores they have. A core is like a mini-CPU inside the main CPU, and more cores mean the CPU can do more tasks at once. Here are the main types:

- Single-Core CPU: The oldest type, used in the 1970s. It can only handle one task at a time, so it is slow for modern apps like games or web browsers.
- Dual-Core CPU: Has two cores, so it can handle two tasks at once. It is faster and better for multitasking, like listening to music while doing homework.
- Quad-Core CPU: Has four cores, making it great for heavy tasks like video editing or playing modern games. It is very fast and common in today's computers.

Why is the CPU Called the Brain of the Computer?

The CPU earns its nickname as the "brain" because it is responsible for thinking through and executing every task in a computer. Just like your brain processes information to make decisions, the CPU processes instructions to make your computer do what you want. Without a CPU, a computer would just be a lifeless box of parts.

How Does the CPU Make Computers Faster?

Modern CPUs are designed to be super efficient. Here are a few ways they speed things up:

- Multiple Cores: Many CPUs have multiple cores, which are like mini-CPUs that can work on different tasks at the same time.
- Faster Clocks: The clock speed (measured in GHz, like 3.5 GHz) determines how many instructions the CPU can handle per second.
- Bigger Cache: More cache means the CPU can store more data close by, reducing wait times.
- Pipelining: This lets the CPU start working on the next instruction before finishing the current one, like a factory line.

Advantages and Disadvantages of CPUs

Advantages

- Versatile: CPUs can handle all kinds of tasks, from simple math to running complex games.
- Fast: Modern CPUs process billions of instructions per second.
- Multi-tasking: Multi-core CPUs let you run many programs at once, like watching a video while chatting with friends.
- Compatible: CPUs work with tons of software, so you can use the same CPU for different apps.

Disadvantages

- Heat: CPUs get hot when working hard, so computers need fans or cooling systems to stay safe.
- Power Use: Powerful CPUs use a lot of electricity, which can raise power bills.
- Cost: High-performance CPUs, like Intel Core i9, can be expensive.
- Not Perfect for All Tasks: For tasks like graphics or video editing, specialized chips like GPUs (Graphics Processing Units) are better than CPUs.

History of CPU

The story of the CPU started long ago and has milestones that changed how computers work. Here is a simple timeline:

- 1823: Baron Jons Jakob Berzelius discovered silicon, a material still used to make CPUs today.
- 1947: John Bardeen, Walter Brattain, and William Shockley invented the transistor, a tiny switch that made modern CPUs possible.
- 1958: Jack Kilby and Robert Noyce created the integrated circuit, combining many transistors into a single chip.
- 1971: Intel released the Intel 4004, the first-ever microprocessor (a CPU on a single chip), starting the era of personal computers.
- 1979: Motorola introduced the Motorola 68000, a powerful CPU used in early computers and gaming consoles.
- 1999: Intel launched Celeron processors, making computers faster and more affordable.
- 2005: AMD introduced the first dual-core processor, allowing CPUs to handle multiple tasks at once.
- 2009: Intel released Core i5, a four-core processor that made computers even faster.
- 2017-2018: Intel introduced Core i9, one of the most powerful CPUs for desktops and laptops.

Modern Applications

CPUs are everywhere, not just in computers:

- CPU in Personal Computers: In your laptop or desktop, the CPU runs games, apps, and school programs, making sure everything works smoothly.
- Role in Mobile Devices: Phones and tablets have CPUs too. They are smaller and use less power but still handle calls, apps, and videos.
- Use in Servers and Data Centers: In large data centers, CPUs power websites like YouTube and Google, processing millions of requests every second.`,
    video: {
      src: '/videos/Common CPU Components.mp4',
      mimeType: 'video/mp4',
    },
  },
  {
    id: 2,
    slug: 'architecture-fundamentals',
    order: 2,
    title: 'Architecture Fundamentals',
    competencyCode: 'ARCH',
    description: 'Core concepts of computer architecture: von Neumann vs Harvard models, stored-program concept...',
    lessonContent: `Difference between Von Neumann and Harvard Architecture

Von Neumann and Harvard architectures are two basic models in computer architecture, explaining how memory and processing units are organized in a computer system. For Computer Science learners and professionals, understanding these architectures is essential.

While Von Neumann architecture is dominant in general-purpose computing, Harvard architecture is important in embedded and specialized systems. Understanding their differences, advantages, and disadvantages helps determine which architecture is suitable for a given application.

Von Neumann Architecture

Von Neumann Architecture is a digital computer architecture based on the stored-program concept, where program instructions and data are stored in the same memory. This architecture was proposed by John Von Neumann in 1945.

Advantages of Von Neumann Architecture

- Simplicity: Storing data and instructions in one memory space simplifies system design.
- Cost-Effective: Fewer components are required compared to architectures with separate memory paths.
- Flexibility: Programs can be changed without modifying physical circuitry.

Disadvantages of Von Neumann Architecture

- Bottleneck Issues: Shared bus means data and instructions cannot be fetched simultaneously, reducing speed.
- Memory Corruption Risk: Data and instructions sharing memory increases risk of accidental overwrite.

Harvard Architecture

Harvard Architecture is a digital computer architecture that uses separate storage and separate buses for instructions and data. It was developed to overcome the Von Neumann bottleneck.

Features

- Separate memory spaces
- Fixed instruction length
- Parallel instruction and data access
- More efficient memory usage
- Suitable for embedded systems
- Limited flexibility

Advantages of Harvard Architecture

- Faster Processing: Separate buses avoid contention and improve performance.
- Improved Security: Separating data and instruction memory reduces corruption risk.
- Efficient Resource Use: Different memory sizes/types can be optimized for instructions and data.

Disadvantages of Harvard Architecture

- Complexity: Design and implementation are more intricate.
- Higher Cost: Requires separate memories and buses, increasing hardware cost.
- Less Flexibility: Modifications can be more difficult due to separate memory regions.

Key Differences Between Von Neumann and Harvard Architecture

- Von Neumann: Ancient architecture based on stored-program concept.
  Harvard: Modern architecture based on Harvard Mark I relay model.

- Von Neumann: Same physical memory address space for instructions and data.
  Harvard: Separate physical memory spaces for instructions and data.

- Von Neumann: Common bus for instruction and data transfer.
  Harvard: Separate buses for instruction and data transfer.

- Von Neumann: Typically requires two clock cycles for one instruction flow segment due to shared path.
  Harvard: Can execute instruction flow in a single cycle segment with parallel access.

- Von Neumann: Cheaper.
  Harvard: More costly.

- Von Neumann: CPU cannot fetch instruction and read/write data at the same time.
  Harvard: CPU can fetch instruction and read/write data simultaneously.

- Von Neumann: Used in personal and small general-purpose computers.
  Harvard: Used in microcontrollers and signal processing systems.`,
    video: {
      src: '/videos/Harvard Architecture versus Von Neumann Architecture.mp4',
      mimeType: 'video/mp4',
    },
  },
  {
    id: 3,
    slug: 'memory-hierarchy',
    order: 3,
    title: 'Memory Hierarchy',
    competencyCode: 'MH',
    description: 'Memory system organization: register files, SRAM caches, DRAM main memory, secondary storage...',
    lessonContent: `Memory Hierarchy Design and its Characteristics

Why Memory Hierarchy is Required in the System?

Memory Hierarchy helps in optimizing the memory available in the computer. There are multiple levels present in the memory, each one having a different size and different cost. Some types of memory like cache and main memory are faster as compared to other types of memory, but they have less size and are more costly. Other memory types have higher storage but are slower. Data access is not similar in all memory types; some have faster access whereas some have slower access.

Types of Memory Hierarchy

This Memory Hierarchy Design is divided into 2 main types:

1. External Memory or Secondary Memory: Comprising Magnetic Disk, Optical Disk, and Magnetic Tape, i.e., peripheral storage devices accessible by the processor via an I/O module.
2. Internal Memory or Primary Memory: Comprising Main Memory, Cache Memory, and CPU registers. This is directly accessible by the processor.

Memory Hierarchy Design

1. Registers
Registers are small, high-speed memory units located in the CPU. They are used to store the most frequently used data and instructions. Registers have the fastest access time and the smallest storage capacity, typically ranging from 16 to 64 bits.

2. Cache Memory
Cache memory is a small, fast memory unit located close to the CPU. It stores frequently used data and instructions that have been recently accessed from the main memory. Cache memory is designed to minimize the time it takes to access data by providing the CPU with quick access to frequently used data.

3. Main Memory
Main memory, also known as RAM (Random Access Memory), is the primary memory of a computer system. It has a larger storage capacity than cache memory, but it is slower. Main memory is used to store data and instructions that are currently in use by the CPU.

Types of Main Memory:
- Static RAM: Stores binary information in flip-flops, and information remains valid while power is supplied. Static RAM has faster access time and is used in implementing cache memory.
- Dynamic RAM: Stores binary information as charge on a capacitor. It requires refreshing circuitry to maintain charge after a few milliseconds. It contains more memory cells per unit area compared to SRAM.

4. Secondary Storage
Secondary storage, such as hard disk drives (HDD) and solid-state drives (SSD), is a non-volatile memory unit with larger storage capacity than main memory. It stores data and instructions not currently in use by the CPU. Secondary storage has the slowest access time and is typically the least expensive in the hierarchy.

5. Magnetic Disk
Magnetic disks are circular plates made of metal or plastic coated with magnetized material. They operate at high speed inside the computer and are frequently used.

6. Magnetic Tape
Magnetic tape is a magnetic recording medium covered with a plastic film. It is generally used for backup of data. Access time is slower and requires additional time for strip access.

Characteristics of Memory Hierarchy

- Capacity: Total volume of information memory can store. As we move from top to bottom in the hierarchy, capacity increases.
- Access Time: Time interval between read/write request and data availability. As we move from top to bottom, access time increases.
- Performance: The memory hierarchy design ensures that frequently accessed data is stored in faster memory to improve system performance.
- Cost Per Bit: As we move from bottom to top, cost per bit increases, i.e., internal memory is costlier than external memory.

Advantages of Memory Hierarchy

- Performance: Frequently used data is stored in faster memory (like cache), reducing access time and improving system performance.
- Cost Efficiency: Combining small, fast memory (registers/cache) with larger, slower memory (RAM/HDD) balances cost and performance.
- Optimized Resource Utilization: Combines small, fast memory and large, cost-effective storage to maximize system performance.
- Efficient Data Management: Frequently accessed data stays closer to the CPU, while less frequently used data stays in larger, slower memory.

Disadvantages of Memory Hierarchy

- Complex Design: Managing and coordinating data across levels adds complexity to system design and operation.
- Cost: Faster memory components like registers and cache are expensive, limiting size and increasing system cost.
- Latency: Accessing data in slower memory (secondary/tertiary storage) increases latency and reduces performance.
- Maintenance Overhead: Managing and maintaining different memory types adds hardware and software overhead.`,
    video: {
      src: '/videos/Memory Hierarchy Introduction.mp4',
      mimeType: 'video/mp4',
    },
  },
  {
    id: 4,
    slug: 'cache-organization',
    order: 4,
    title: 'Cache Organization',
    competencyCode: 'CACHE',
    description: 'Cache design and optimization: direct-mapped, set-associative, and fully associative caches...',
    lessonContent: `Cache Memory in Computer Organization

Cache memory is a small, high-speed storage area in a computer. It stores copies of data from frequently used main memory locations. There are various independent caches in a CPU, which store instructions and data.

- The most important use of cache memory is to reduce the average time to access data from main memory.
- The concept of cache works because locality of reference exists in processes (the same items or nearby items are likely to be accessed next).

By storing this information closer to the CPU, cache memory helps speed up overall processing time. Cache memory is much faster than main memory (RAM). When the CPU needs data, it first checks the cache. If the data is there, the CPU can access it quickly. If not, it must fetch data from slower main memory.

Characteristics of Cache Memory

- Extremely fast memory type that acts as a buffer between RAM and the CPU.
- Holds frequently requested data and instructions so they are immediately available to the CPU.
- Costlier than main memory or disk memory but more economical than CPU registers.
- Used to speed up processing and synchronize with the high-speed CPU.

Levels of Memory

- Level 1 or Register: Data is stored and accepted immediately in the CPU. Common registers include accumulator, program counter, and address register.
- Level 2 or Cache Memory: Fast memory with faster access time where data is temporarily stored for quick access.
- Level 3 or Main Memory: Memory on which the computer currently works. It is smaller and volatile.
- Level 4 or Secondary Memory: External memory that is slower than main memory but stores data permanently.

Cache Performance

When the processor needs to read or write a location in main memory, it first checks for a corresponding entry in cache.

- If found, a cache hit occurs and data is read from cache.
- If not found, a cache miss occurs. The cache allocates a new entry, copies data from main memory, then fulfills the request from cache.

The performance of cache memory is frequently measured by hit ratio.

Hit Ratio (H) = hit / (hit + miss) = number of hits / total accesses
Miss Ratio = miss / (hit + miss) = number of misses / total accesses = 1 - H

Cache performance can be improved by higher cache block size, higher associativity, reducing miss rate, reducing miss penalty, and reducing cache hit time.

Cache Mapping

Cache mapping refers to the method used to store data from main memory into cache. It determines how memory data is mapped to specific cache locations.

Types of mapping:

- Direct Mapping
- Fully Associative Mapping
- Set-Associative Mapping

1. Direct Mapping

Direct mapping is a simple and commonly used technique where each block of main memory maps to exactly one cache line. If two memory blocks map to the same cache line, one overwrites the other, causing potential misses.

Memory block is assigned to cache line using:

i = j modulo m = j % m

where:

- i = cache line number
- j = main memory block number
- m = number of lines in cache

Example: with 8 memory blocks and 4 cache lines, block 4 maps to cache line 0 (4 % 4 = 0), replacing the previous block in line 0.

Main memory address is split into:

- Index Field: represents block number and indicates block location.
- Block Offset: represents word position inside the block.

Cache memory address includes:

- Block Offset: same meaning as in main memory.
- Index: cache line number.
- Tag: remaining address bits identifying which memory block occupies the line.

Memory Structure in Direct Mapping

The index field in main memory maps directly to cache index. Block offset indicates exact word within a block. Tag identifies which memory block is currently in that line.

2. Fully Associative Mapping

In fully associative mapping, any main memory block can be stored in any cache line. This improves hit ratio but requires complex searching and management.

There is no index field in cache address for this mapping. It only uses tag and offset. To find data, the tag is compared with tags in all cache lines.

- Match found: cache hit.
- No match: cache miss; data is fetched from main memory.

3. Set-Associative Mapping

Set-associative mapping is a compromise between direct mapping and fully associative mapping. Multiple cache lines are grouped into sets.

v = m / k

where:

- m = number of cache lines
- k = cache lines per set
- v = number of sets

Each memory block can be placed into any line within a specific set.

i = j modulo v = j % v

where:

- j = main memory block number
- v = number of sets
- i = set number

This reduces conflict misses compared to direct mapping while keeping search space smaller than fully associative mapping.

Application of Cache Memory

- Primary Cache: Located on processor chip. Small and very fast.
- Secondary Cache: Between primary cache and rest of memory (often L2, also on chip).
- Spatial Locality of Reference: Nearby memory locations are likely to be accessed soon.
- Temporal Locality of Reference: Recently accessed data is likely to be accessed again.

Advantages

- Faster than main memory and secondary memory.
- Programs in cache can execute in less time.
- Data access time is lower than main memory.
- Stores frequently used data and instructions, improving CPU performance.

Disadvantages

- Costlier than primary and secondary memory.
- Data is stored temporarily.
- Data and instructions in cache are lost when system is turned off.
- High cache cost increases total computer system price.`,
    video: {
      src: '/videos/How Cache Works Inside a CPU.mp4',
      mimeType: 'video/mp4',
    },
  },
  {
    id: 5,
    slug: 'virtual-memory-and-ecc',
    order: 5,
    title: 'Virtual Memory and ECC',
    competencyCode: 'VM',
    description: 'Virtual memory and reliability: page tables, TLB operation, demand paging...',
    lessonContent: `Virtual Memory in Operating System

Virtual memory is a memory management technique used by operating systems to give the appearance of a large, continuous block of memory to applications, even if physical memory (RAM) is limited and not allocated contiguously. The main idea is to divide processes into pages, move pages to disk when RAM is needed, and bring them back when required.

Objectives of Virtual Memory

- A program does not need to be fully loaded in memory to run. Only needed parts are loaded.
- Programs can be larger than physical memory.
- Virtual memory creates the illusion of large memory even when RAM is small.
- It uses both RAM and disk storage to manage memory efficiently, allowing more programs to run at once.

How Virtual Memory Works

- Virtual memory uses both hardware and software.
- Programs use virtual addresses, not direct physical addresses.
- The system translates virtual addresses to physical RAM addresses during execution.

Types of Virtual Memory

Virtual memory is managed by the Memory Management Unit (MMU), often built into the CPU. The CPU generates virtual addresses, and the MMU translates them into physical addresses.

Two main types:

- Paging
- Segmentation

1. Paging

Paging divides memory into fixed-size blocks called pages. When RAM is full, pages not currently in use are moved to disk into a swap file.

- Swap file acts as an extension of RAM.
- When a page is needed again, it is swapped back into RAM.

This ensures the OS and applications have enough memory to run.

Page Fault Service Time

The time taken to handle a page fault is called page fault service time.

Let:

- Main memory access time = m
- Page fault service time = s
- Page fault rate = p

Then:

Effective memory access time = (p * s) + (1 - p) * m

Page and Frame

- Page: fixed-size block in virtual memory.
- Frame: fixed-size block in physical RAM where pages are loaded.

Think of a page as a puzzle piece (virtual memory) and a frame as its slot on the board (physical memory).

2. Segmentation

Segmentation divides virtual memory into variable-sized segments.

- Segments not currently needed can be moved to disk.
- Segment tables track each segment's status, physical location, and modification state.
- Segments are mapped to process address space when required.

Applications of Virtual Memory

- Increased Effective Memory: Uses disk space to extend available memory and run larger applications.
- Memory Isolation: Gives each process its own address space, improving safety and reliability.
- Efficient Memory Management: Better utilization through paging and segmentation.
- Simplified Program Development: Programmers can design as if one large memory block exists.

Management of Virtual Memory

1. Adjust Page File Size

- Automatic Management: Modern operating systems can automatically manage page file size.
- Manual Configuration: Advanced users may tune custom values for performance.

2. Place Page File on a Fast Drive

- SSD Placement: Putting the page file on SSD improves read/write performance.
- Separate Drive: In multi-drive systems, placing page file on a different drive can improve responsiveness.

3. Monitor and Optimize Usage

- Performance Monitoring: Use system tools to monitor virtual memory usage.
- Regular Maintenance: Close unnecessary background tools/apps to free memory.

4. Disable Virtual Memory for SSD (with caution)

- If RAM is very large (e.g., 16GB+), page file adjustments can be considered.
- Must be done carefully to avoid application memory issues.

5. Optimize System Settings

- Tune system settings for virtual memory efficiency.
- Keep drivers and system updates current for memory-management improvements.

Benefits of Using Virtual Memory

- Supports Multiprogramming and Larger Programs: Enables more processes and execution of programs larger than RAM.
- Maximizes Application Capacity: Allows many and large applications to run simultaneously.
- Reduces Immediate RAM Upgrade Need: Disk-backed memory extends capacity.
- Boosts Security and Isolation: Separate process spaces reduce interference and corruption.
- Improves CPU/System Performance: Better logical partitioning and resource allocation.
- Enhances Memory Management Efficiency: Automates RAM-disk movement and reduces fragmentation issues.

Limitations of Virtual Memory

- Slower Performance: Disk access is slower than RAM.
- Risk of Data Loss: Failures during swapping (e.g., power loss) can cause data issues.
- Increased Complexity: OS must manage both virtual and physical memory maps.

Virtual Memory vs Physical Memory

- Definition:
  Virtual Memory: Abstraction extending memory via disk.
  Physical Memory (RAM): Actual hardware memory used directly by CPU.

- Location:
  Virtual Memory: Hard drive or SSD.
  Physical Memory: RAM modules on motherboard.

- Speed:
  Virtual Memory: Slower (disk I/O involved).
  Physical Memory: Faster (direct CPU access).

- Capacity:
  Virtual Memory: Larger, limited by disk space.
  Physical Memory: Smaller, limited by installed RAM.

- Cost:
  Virtual Memory: Lower incremental storage cost.
  Physical Memory: Higher cost per capacity.

- Data Access:
  Virtual Memory: Indirect (paging/swapping).
  Physical Memory: Direct.

- Volatility:
  Virtual Memory: Non-volatile on disk.
  Physical Memory: Volatile (lost on power off).`,
    video: {
      src: '/videos/Virtual Memory Explained (including Paging).mp4',
      mimeType: 'video/mp4',
    },
  },
  {
    id: 6,
    slug: 'instruction-set-architecture',
    order: 6,
    title: 'Instruction Set Architecture',
    competencyCode: 'ISA',
    description: 'Study of ISA design philosophies: RISC vs CISC approaches, fixed vs variable-length encoding...',
    lessonContent: `Instruction Set Architecture and Microarchitecture

Microarchitecture and Instruction Set Architecture (ISA) are two fundamental concepts in computer organization. When we use a computer or smartphone, there is a lot going on behind the scenes in the processor (CPU). Two important parts that make everything work are:

- ISA (Instruction Set Architecture)
- Microarchitecture

Instruction Set Architecture (ISA)

ISA is the language of the CPU that tells it what operations it can perform, such as adding numbers, loading data, or jumping to another instruction.
It defines how software communicates with hardware through specific instruction rules and formats. It includes:

- Instruction types (ADD, LOAD, JUMP), registers, data types, and memory access.
- Interrupt handling and system-level communication.

Objective of ISA - MIPS ISA

To understand what an ISA aims to do, let us take MIPS ISA as an example. MIPS is popular in computer science courses because it is simple and clean.

Defines Types of Instructions

MIPS divides instructions into three main types:

- Arithmetic/Logic Instructions perform basic operations such as ADD, SUB, AND, and OR on data stored in registers.
- Data Transfer Instructions are used to move data between memory and registers; for example, LW (load word) and SW (store word).
- Branch and Jump Instructions control the execution flow of the program, making decisions and handling loops or function calls; examples include BEQ (branch if equal) and J (jump).

Defines Instruction Length

MIPS is a 32-bit ISA, meaning every instruction must be exactly 32 bits (4 bytes) long. This fixed length simplifies the design and makes it more efficient for both hardware and compiler developers.

Defines Instruction Formats

Since all MIPS instructions are 32 bits long, the ISA defines how those 32 bits are organized for different instruction types. MIPS uses three instruction formats:

- R-type: Arithmetic and logic operations (e.g., ADD, SUB)
- I-type: Data transfer and conditional branches (e.g., LW, BEQ)
- J-type: Unconditional jumps (e.g., J)

Microarchitecture vs. ISA

Microarchitecture includes components like the ALU for calculations, pipelines for faster processing, cache for quick memory access, the control unit, and execution units.

- Processors with the same ISA can have very different microarchitectures.
- ISA defines what a CPU can do, while microarchitecture is how the CPU is designed internally to carry out those instructions.

Importance of ISA

1. Foundation of Processor Design

ISA forms the core design element of any processor. Whether it is RISC (Reduced Instruction Set Computing) or CISC (Complex Instruction Set Computing), the choice of ISA impacts all other design decisions.

2. Instruction Execution Understanding

Computer architecture courses often focus on instruction execution, pipelining, control unit design, and instruction formats, all of which are defined by the ISA.

3. Enables Assembly Language Programming

Understanding ISA is critical for assembly-level programming. It helps in:

- Writing instruction sequences.
- Understanding how data is loaded and stored.
- Analyzing program execution time.

4. Impact on Performance Metrics

A well-designed ISA can lead to efficient hardware implementation and optimized software execution. ISA affects:

- CPI (Cycles Per Instruction)
- Instruction count
- Execution time

5. Compatibility and Portability

ISA determines software compatibility. If two processors implement the same ISA, they can run the same programs, even if their internal microarchitectures are different.

Types of ISA

There are multiple types of ISA, each designed with different goals in mind, such as simplifying instruction sets for faster execution, supporting complex operations with fewer instructions, or enabling parallel processing to improve performance.

- RISC: Few, simple instructions for speed.
- CISC: Many complex instructions.
- VLIW: Runs multiple operations in one instruction.
- EPIC: Tries to run things in parallel.
- Stack-based: Uses a stack instead of registers.`,
    video: {
      src: '/videos/Instruction-level Parallelism.mp4',
      mimeType: 'video/mp4',
    },
  },
  {
    id: 7,
    slug: 'pipelining-and-hazards',
    order: 7,
    title: 'Pipelining and Hazards',
    competencyCode: 'PIPE',
    description: 'Instruction pipelining: 5-stage pipeline design, data hazards, control hazards...',
    lessonContent: `Pipelined architecture with its diagram

Pipelining is a CPU hardware design technique used to enhance overall performance. In a pipelined processor, operations are divided into stages that are executed in parallel. This allows multiple instructions to be processed simultaneously, each in a different stage of execution.

Instead of completing one instruction at a time, the processor begins a new instruction before the previous one finishes, with each instruction progressing through different stages. This approach enables more efficient instruction handling by overlapping the execution steps.

Pipeline Processor

A pipeline processor is a type of CPU architecture that improves processing speed by dividing instruction execution into separate stages. Each stage handles a specific part of the instruction, such as fetching, decoding, executing, memory access, and writing results. While one instruction is being executed, others are moving through the earlier stages, allowing multiple instructions to be processed at the same time.

This is similar to an assembly line in a factory, where different workers (stages) handle different tasks on multiple products (instructions) simultaneously. This overlap increases the overall efficiency and throughput of the processor.

For example, consider how cars are built in a factory:

- One worker installs the engine.
- The next adds the wheels.
- Another paints the car.
- The last one performs final checks.

Similarly, in pipelining, different parts of multiple instructions are processed simultaneously at different stages.

Design of a basic Pipeline

In a pipelined processor, a pipeline has two ends, the input end and the output end. Between these ends, there are multiple stages or segments such that the output of one stage is connected to the input of the next stage and each stage performs a specific operation.

Interface registers are used to hold the intermediate output between two stages. These interface registers are also called latch or buffer.

All the stages in the pipeline along with the interface registers are controlled by a common clock.

It consists of a sequence of m data-processing circuits, called stages or segments, which collectively perform a single operation on a stream of data operands passing through them.

Some processing takes place in each stage, but a final result is obtained only after the entire operand set has passed through the entire pipeline.

Components in the Diagram

The components used in the pipeline diagram are:

- Data In: Input data that enters the pipeline.
- Stages (S1, S2, ..., Sm): Each stage performs part of the operation.
- Registers (R1, R2, ..., Rm): Pipeline registers that temporarily hold data between stages.
- Computation Units (C1, C2, ..., Cm): Units that perform actual processing such as arithmetic or logical operations.
- Control Unit: Manages timing and control signals so each stage runs in sync.
- Data Out: Final output after processing across all stages.

Working

- In clock cycle 1, data enters Stage S1 (R1 -> C1).
- In clock cycle 2, that data moves to Stage S2 (R2 -> C2), while new data enters Stage S1.
- This process continues, and each stage is simultaneously processing a different piece of data.
- Eventually, the output appears at the end after passing through all stages.

Instruction Execution In Pipelining

The pipeline is more efficient if the instruction cycle is divided into segments of equal duration. In general, a computer processes each instruction in the following sequence:

- FI: Fetches the instruction into the instruction register.
- DA: Decodes the instruction opcode.
- FO: Fetches operands into the data register.
- EX: Executes the specified operation and stores it.

Example of Instruction pipeline

- In the first clock cycle, the first instruction is fetched in Segment 1.
- In the second clock cycle, the first instruction moves to Decode while the second instruction is fetched.
- This overlapping continues, improving throughput.

Now consider a branch instruction:

- While the third instruction is in Decode, the fourth instruction is fetched.
- Since the branch might alter control flow, the next instruction target may change.
- Therefore, the fourth instruction is held (or discarded in some designs) until the branch is resolved in Execute.
- Once the branch outcome is known, either the next instruction is re-fetched (if taken), or the original fourth instruction continues (if not taken).

Pipelining Hazards

Pipelining is not suitable for all kinds of instructions. Some instructions can stall or flush the pipeline. These problems are called pipelining hazards.

Structural Hazards:

Structural hazards arise due to resource conflicts in the pipeline. A resource conflict occurs when more than one instruction tries to access the same resource in the same cycle.

Data Hazards:

Data hazards occur when an instruction depends on the result of a previous instruction whose result has not yet been computed. This happens when different instructions use the same storage location and ordering must appear sequential.

There are four types of data dependencies:

- Read after Write (RAW)
- Write after Read (WAR)
- Write after Write (WAW)
- Read after Read (RAR)

Control Hazards:

Control hazards occur during transfer-of-control instructions such as BRANCH, CALL, and JMP. The processor may not know the target address when it needs to insert the next instruction into the pipeline, so unwanted instructions can be fed into the pipeline.

Performance Evaluation Factors for Pipelining

- Latency: Time taken for a single instruction to complete execution.
- Efficiency: Measures how effectively stages are utilized.
- Throughput: Number of instructions completed per unit time.

Benefits of Pipelining

- Increases instruction throughput.
- Better utilization of processor components.
- Efficient for repetitive tasks or streaming data.

Disadvantages of Pipelining

- Designing a pipelined processor is complex.
- Hazard problems for branch instructions increase with longer pipelines.
- It is difficult to predict throughput of a pipelined processor.`,
    video: {
      src: '/videos/Pipeline Architecture.mp4',
      mimeType: 'video/mp4',
    },
  },
  {
    id: 8,
    slug: 'advanced-execution',
    order: 8,
    title: 'Advanced Execution',
    competencyCode: 'ILP',
    description: 'Advanced CPU techniques: out-of-order execution, register renaming, speculative execution...',
    lessonContent: `Instruction Level Parallelism

Instruction-Level Parallelism (ILP) refers to the capability of a processor to execute multiple instructions at the same time. Instead of running each instruction strictly one after another, ILP uses hardware and compiler techniques to overlap instruction execution wherever dependencies allow.

- Identifies independent instructions and runs them in parallel.
- Works within a single processor, not across multiple cores.
- Basis of modern CPUs with organized instruction scheduling.

ILP processors have execution hardware similar to RISC processors. Machines without ILP typically need more complex handling and are less efficient in exploiting overlap opportunities. A typical ILP design allows multiple-cycle operations to be pipelined.

Example

Suppose 4 operations can be carried out in a single clock cycle. Then there are 4 functional units, a branch unit, and a common register file in ILP execution hardware. Sub-operations can include Integer ALU, Integer Multiplication, Floating Point Operations, Load, and Store with representative latencies 1, 2, 3, 2, 1.

Example instruction sequence:

y1 = x1 * 1010
y2 = x2 * 1100
z1 = y1 + 0010
z2 = y2 + 0101
t1 = t1 + 1
p = q * 1000
clr = clr + 0010
r = r + 0001

"nop" (no operation) indicates processor idle time. With ILP, many of those idle slots can be used by independent instructions while earlier operations are still executing. In sequential execution, each cycle runs one operation. In ILP execution, a cycle can include multiple operations if dependencies allow.

Instruction Level Parallelism (ILP) Architecture

ILP is achieved when multiple operations are performed in a single cycle, either by executing them simultaneously or by utilizing gaps between operations caused by latencies. Scheduling decisions can be influenced by both compiler and hardware. The extent of compiler control depends on the ILP architecture type.

Classification of ILP Architectures

- Sequential Architecture: Program does not explicitly convey parallelism information to hardware (e.g., superscalar style handling).
- Dependence Architectures: Program explicitly conveys dependency information between operations (e.g., dataflow-oriented designs).
- Independence Architecture: Program provides information on independent operations so they can be executed in place of nop slots.

To apply ILP effectively, compiler and hardware must determine:

- Data dependencies
- Independent operations
- Scheduling of independent operations
- Assignment of functional units
- Register allocation and data storage timing

Advantages of Instruction-Level Parallelism

- Improved Performance: Multiple instructions can execute simultaneously or out-of-order, improving execution speed and throughput.
- Efficient Resource Utilization: Better usage of processor units reduces idle resources.
- Reduced Instruction Dependency Impact: Better scheduling can reduce dependency bottlenecks.
- Increased Throughput: Helps multi-threaded and parallel workloads by increasing instruction completion rate.

Disadvantages of Instruction-Level Parallelism

- Increased Complexity: Requires additional hardware and sophisticated control logic.
- Instruction Overhead: Coordination and scheduling overhead can reduce gains in some cases.
- Data Dependency Limits: True dependencies still constrain achievable parallelism.
- Reduced Energy Efficiency: Extra hardware and control can increase power usage and cost.`,
    video: {
      src: '/videos/Instruction-level Parallelism.mp4',
      mimeType: 'video/mp4',
    },
  },
  {
    id: 9,
    slug: 'performance-analysis',
    order: 9,
    title: 'Performance Analysis',
    competencyCode: 'PERF',
    description: 'Quantitative performance evaluation: CPU time equation, CPI analysis, MIPS and FLOPS metrics...',
    lessonContent: `Computer Organization - Amdahls law and its proof.txt
Computer Organization | Amdahl's law and its proof

Amdahlâ€™s Law, proposed by Gene Amdahl in 1967, explains the theoretical speedup of a program when part of it is improved or parallelized. It is widely used in parallel computing to predict the benefits of using multiple processors.

The main idea is that the speedup of a system is limited by the portion of the program that cannot be parallelized (the sequential part).

Key Terms
	Speedup (S):
	Performance improvement gained by enhancement.

	S = New Execution Time / Old Execution Time

	Fraction Enhanced (P):
	The proportion of the program that can be parallelized (0 < P < 1).

	Number of Processors (N):
	The number of parallel units used for execution.

Formula

	S=1 / (1âˆ’P) + P/N

	(1 - P): sequential portion (cannot be parallelized).
	P/N: parallel portion divided among N processors.

Maximum Speedup
	
	If processors are unlimited (N â†’ âˆž)

	S max = 1 / 1âˆ’P

	This means the non-parallelizable fraction sets the performance limit.
	
	If P = 1 (100% parallelizable), theoretical speedup is infinite (not realistic).


Example

	Suppose a program spends 20% (P = 0.2) of its time in parallelizable work, and we use 5 processors (N = 5):

	S=1(1âˆ’0.2)+0.25=10.8+0.04=1.19S = \frac{1}{(1 - 0.2) + \frac{0.2}{5}} = \frac{1}{0.8 + 0.04} = 1.19S=(1âˆ’0.2)+50.2â€‹1â€‹=0.8+0.041â€‹=1.19

	âž¡ The system improves by only 19%, showing that the 80% sequential part is the bottleneck.

Advantages

	Provides a clear upper bound on performance.
	Helps identify bottlenecks in programs.
	Useful in guiding hardware/software design decisions.

Disadvantages

	Assumes the sequential part is fixed (in practice, it can sometimes be optimized).
	Assumes processors are identical, not always true in heterogeneous systems.
	Ignores real-world factors like communication, synchronization, and load balancing overhead.`,
    video: {
      src: '/videos/Performance Analysis.mp4',
      mimeType: 'video/mp4',
    },
  },
]
