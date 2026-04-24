export type DiagnosticQuestion = {
  id: number
  question: string
  options: string[]
  correctAnswerIndex: number
  module: string
  bloomLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create'
  weight: number
  competencyCode: string
}

export type DiagnosticQuestionStage = 'prelim' | 'midterm' | 'final'

const BLOOM_LEVEL_WEIGHTS: Record<DiagnosticQuestion['bloomLevel'], number> = {
  Remember: 1,
  Understand: 1,
  Apply: 2,
  Analyze: 3,
  Evaluate: 4,
  Create: 4,
}

const addWeights = (questions: Omit<DiagnosticQuestion, 'weight'>[]): DiagnosticQuestion[] => {
  return questions.map((question) => ({
    ...question,
    weight: BLOOM_LEVEL_WEIGHTS[question.bloomLevel],
  }))
}

const DIAGNOSTIC_PRETEST_QUESTION_BANK: DiagnosticQuestion[] = addWeights([
  {
    id: 1,
    module: 'Memory Hierarchy',
    question: 'You are designing a computer with a strict budget but you still need low average memory access time and large total capacity. Which design choice is the BEST way to meet these competing goals?',
    options: [
      'Use only a single large, fast memory technology for everything',
      'Use a hierarchy of small fast memories plus larger slower memories to balance speed and cost',
      'Eliminate caches so memory access is predictable',
      'Rely on secondary storage as the primary working memory',
    ],
    correctAnswerIndex: 1,
    bloomLevel: 'Evaluate',
    competencyCode: 'MH',
  },
  {
    id: 2,
    module: 'Memory Hierarchy',
    question: 'Which category includes cache memory, main memory, and registers?',
    options: ['External Memory', 'Secondary Memory', 'Internal Memory', 'Peripheral Memory'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'MH',
  },
  {
    id: 3,
    module: 'Memory Hierarchy',
    question: 'What is the main characteristic of CPU registers?',
    options: ['Large storage capacity', 'Slow access time', 'Located outside CPU', 'Fastest access with smallest size'],
    correctAnswerIndex: 3,
    bloomLevel: 'Understand',
    competencyCode: 'MH',
  },
  {
    id: 4,
    module: 'Memory Hierarchy',
    question: 'Which memory stores frequently used data close to the CPU?',
    options: ['Magnetic Tape', 'Cache Memory', 'Optical Disk', 'Secondary Storage'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'MH',
  },
  {
    id: 5,
    module: 'Memory Hierarchy',
    question: 'While rendering a video, the CPU needs to quickly read and write the data it is actively working on. Which memory is primarily used to store this data during execution?',
    options: ['Store permanent data only', 'Store data currently used by CPU', 'Replace cache memory', 'Provide backup storage'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'MH',
  },
  {
    id: 6,
    module: 'Memory Hierarchy',
    question: 'You are selecting main memory for a budget laptop. You need large capacity at low cost per bit, and periodic refresh power is acceptable. Which memory technology is the best choice for the main memory?',
    options: ['SRAM', 'DRAM', 'ROM', 'Flash memory'],
    correctAnswerIndex: 1,
    bloomLevel: 'Evaluate',
    competencyCode: 'MH',
  },
  {
    id: 7,
    module: 'Memory Hierarchy',
    question: 'You need to store terabytes of archived logs at the lowest cost per GB, and high latency is acceptable. Which memory type is the BEST fit?',
    options: ['Registers', 'Cache', 'Main Memory', 'Secondary Storage'],
    correctAnswerIndex: 3,
    bloomLevel: 'Evaluate',
    competencyCode: 'MH',
  },
  {
    id: 8,
    module: 'Memory Hierarchy',
    question: 'What happens to memory capacity as we move down the hierarchy?',
    options: ['Decreases', 'Becomes unstable', 'Increases', 'Remains constant'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'MH',
  },
  {
    id: 9,
    module: 'Memory Hierarchy',
    question: 'What happens to access time as we move from top to bottom?',
    options: ['Decreases', 'Increases', 'Remains equal', 'Becomes zero'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'MH',
  },
  {
    id: 10,
    module: 'Memory Hierarchy',
    question: 'You are deciding whether to add more cache levels to improve performance. Which trade-off is a real disadvantage you must plan for?',
    options: ['Guaranteed lower power usage', 'Eliminates the need for main memory', 'More complex system design and verification', 'Always reduces hardware cost'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'MH',
  },
  {
    id: 11,
    module: 'Memory Hierarchy',
    question: 'What is the ideal assumption between processor and memory performance?',
    options: ['Memory is faster than processor', 'They operate at similar speeds', 'Memory replaces processor', 'Processor does not access memory'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'MH',
  },
  {
    id: 12,
    module: 'Memory Hierarchy',
    question: 'What is the current real-world issue in processor-memory interaction?',
    options: ['Memory is faster than processors', 'Both have equal growth', 'Processors are much faster than memory', 'Memory is no longer needed'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'MH',
  },
  {
    id: 13,
    module: 'Memory Hierarchy',
    question: "Why can't a single memory technology satisfy all requirements?",
    options: [
      'It lacks power supply',
      'It cannot be programmed',
      'It cannot be both fast, cheap, and large at the same time',
      'It only supports one operation',
    ],
    correctAnswerIndex: 2,
    bloomLevel: 'Analyze',
    competencyCode: 'MH',
  },
  {
    id: 14,
    module: 'Memory Hierarchy',
    question:
      'You are designing an on-chip L1 cache that must deliver single-digit nanosecond access latency at high CPU frequency. Capacity can be small (e.g., tens of KB) and higher cost per bit is acceptable. Which memory technology is the BEST fit?',
    options: ['eDRAM', 'Off-chip DRAM (e.g., LPDDR)', 'Embedded MRAM', 'SRAM'],
    correctAnswerIndex: 3,
    bloomLevel: 'Evaluate',
    competencyCode: 'MH',
  },
  {
    id: 15,
    module: 'Memory Hierarchy',
    question: 'Which memory offers higher density but slower speed than SRAM?',
    options: ['DRAM', 'Cache', 'Registers', 'CPU'],
    correctAnswerIndex: 0,
    bloomLevel: 'Remember',
    competencyCode: 'MH',
  },
  {
    id: 16,
    module: 'Memory Hierarchy',
    question: 'What is the main goal of memory hierarchy?',
    options: ['Make memory only fast', 'Make memory only large', 'Remove slow memory', 'Make memory appear fast and large'],
    correctAnswerIndex: 3,
    bloomLevel: 'Understand',
    competencyCode: 'MH',
  },
  {
    id: 17,
    module: 'Memory Hierarchy',
    question: 'A profiler shows high cache hit rates because a program repeatedly accesses a small working set and often accesses nearby addresses. Which principle best explains why caching works well here?',
    options: ['Instruction pipelining', 'Locality of reference', 'Parallel processing', 'Virtualization'],
    correctAnswerIndex: 1,
    bloomLevel: 'Analyze',
    competencyCode: 'MH',
  },
  {
    id: 18,
    module: 'Memory Hierarchy',
    question: 'Which type of locality involves accessing nearby data?',
    options: ['Temporal locality', 'Spatial locality', 'Logical locality', 'Random locality'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'MH',
  },
  {
    id: 19,
    module: 'Memory Hierarchy',
    question: 'What does a "hit" mean in memory access?',
    options: ['Data is missing', 'Data is corrupted', 'Data is found in the current memory level', 'Data is deleted'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'MH',
  },
  {
    id: 20,
    module: 'Memory Hierarchy',
    question: 'What does AMAT measure?',
    options: ['Total memory size', 'Average access time of memory hierarchy', 'Number of cache levels', 'Processor speed'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'MH',
  },
  {
    id: 21,
    module: 'CPU Components',
    question: 'What is the main role of the CPU in a computer system?',
    options: ['Store files permanently', 'Process instructions and perform calculations', 'Display graphics', 'Manage internet connection'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'CPU',
  },
  {
    id: 22,
    module: 'CPU Components',
    question: 'When assembling a desktop PC, where do you install the CPU so it can connect to the system bus and memory through the chipset?',
    options: ['Hard disk', 'Power supply', 'Motherboard socket', 'Monitor'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'CPU',
  },
  {
    id: 23,
    module: 'CPU Components',
    question: 'Which component manages and coordinates all CPU operations?',
    options: ['Arithmetic Logic Unit', 'Cache Memory', 'Registers', 'Control Unit'],
    correctAnswerIndex: 3,
    bloomLevel: 'Remember',
    competencyCode: 'CPU',
  },
  {
    id: 24,
    module: 'CPU Components',
    question: 'What is the function of the Arithmetic Logic Unit (ALU)?',
    options: ['Store instructions permanently', 'Perform arithmetic and logical operations', 'Control input devices', 'Manage power supply'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'CPU',
  },
  {
    id: 25,
    module: 'CPU Components',
    question: 'Which CPU component stores data temporarily during processing?',
    options: ['Registers and cache', 'Optical disk', 'Magnetic tape', 'External storage'],
    correctAnswerIndex: 0,
    bloomLevel: 'Analyze',
    competencyCode: 'CPU',
  },
  {
    id: 26,
    module: 'CPU Components',
    question: 'What happens during the fetch stage of the CPU cycle?',
    options: ['Data is deleted', 'Instructions are executed', 'Instructions are retrieved from memory', 'Results are stored permanently'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'CPU',
  },
  {
    id: 27,
    module: 'CPU Components',
    question: 'What is the purpose of the decode stage?',
    options: ['Store results', 'Interpret the instruction', 'Fetch new data', 'Execute operations'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'CPU',
  },
  {
    id: 28,
    module: 'CPU Components',
    question: 'What is the role of the execute stage?',
    options: ['Retrieve instructions', 'Translate instructions', 'Perform the operation', 'Store data in disk'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'CPU',
  },
  {
    id: 29,
    module: 'CPU Components',
    question:
      'A laptop must run a video call, a browser, and background updates at the same time while staying within a tight power limit (e.g., ~15W). Which CPU option is the BEST fit to keep the system responsive under parallel workloads?',
    options: [
      'A high-clock single-core CPU with aggressive turbo boosting',
      'A multi-core CPU that can schedule tasks across separate cores with power management',
      'A dual-core CPU with simultaneous multithreading (SMT) but fewer physical cores',
      'A very-low-frequency many-core CPU tuned for batch throughput over interactive responsiveness',
    ],
    correctAnswerIndex: 1,
    bloomLevel: 'Evaluate',
    competencyCode: 'CPU',
  },
  {
    id: 30,
    module: 'CPU Components',
    question: 'What factor determines how many instructions a CPU can process per second?',
    options: ['Cache size', 'Core color', 'Clock speed', 'Storage type'],
    correctAnswerIndex: 2,
    bloomLevel: 'Analyze',
    competencyCode: 'CPU',
  },
  {
    id: 31,
    module: 'CPU Components',
    question: 'Which components make up the CPU in von Neumann architecture?',
    options: [
      'ALU, Control Unit, Registers, Cache',
      'Disk, RAM, GPU, BIOS',
      'Monitor, Keyboard, Mouse, Printer',
      'Network card, modem, router, switch',
    ],
    correctAnswerIndex: 0,
    bloomLevel: 'Remember',
    competencyCode: 'CPU',
  },
  {
    id: 32,
    module: 'CPU Components',
    question: 'A CPU is executing arithmetic correctly, but instructions are not being fetched and sequenced properly between stages. Which role is responsible for coordinating the instruction sequence and control signals?',
    options: ['Perform arithmetic operations', 'Store results', 'Manage instruction sequence and execution', 'Display output'],
    correctAnswerIndex: 2,
    bloomLevel: 'Analyze',
    competencyCode: 'CPU',
  },
  {
    id: 33,
    module: 'CPU Components',
    question: 'Which operation is performed by the ALU?',
    options: ['Fetch instructions', 'Decode instructions', 'Perform logical comparisons', 'Store instructions'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'CPU',
  },
  {
    id: 34,
    module: 'CPU Components',
    question: 'A mobile CPU core frequently stalls waiting for data from DRAM. You can add only one feature due to strict area and power limits. Which design change best addresses the underlying problem?',
    options: [
      'Add an on-chip cache to exploit locality and reduce average memory access time',
      'Increase the CPU clock speed without changing the memory system',
      'Move registers off-chip to reduce die area',
      'Disable pipelining to simplify the control unit',
    ],
    correctAnswerIndex: 0,
    bloomLevel: 'Evaluate',
    competencyCode: 'CPU',
  },
  {
    id: 35,
    module: 'CPU Components',
    question: 'Where is cache memory located?',
    options: ['On the CPU', 'On the hard disk', 'In external storage', 'In the monitor'],
    correctAnswerIndex: 0,
    bloomLevel: 'Remember',
    competencyCode: 'CPU',
  },
  {
    id: 36,
    module: 'CPU Components',
    question: 'Which cache level is closest to the CPU and fastest?',
    options: ['L3 Cache', 'L2 Cache', 'L1 Cache', 'Virtual Cache'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'CPU',
  },
  {
    id: 37,
    module: 'CPU Components',
    question: 'What does the Program Counter (PC) store?',
    options: ['Current data value', 'Address of next instruction', 'Result of calculation', 'Cache size'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'CPU',
  },
  {
    id: 38,
    module: 'CPU Components',
    question: 'What is the function of the Memory Address Register (MAR)?',
    options: ['Store instruction result', 'Hold memory address for access', 'Store current instruction', 'Perform calculations'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'CPU',
  },
  {
    id: 39,
    module: 'CPU Components',
    question: 'What does the Memory Data Register (MDR) contain?',
    options: ['Address only', 'Instruction count', 'Data being transferred to or from memory', 'Clock signals'],
    correctAnswerIndex: 2,
    bloomLevel: 'Analyze',
    competencyCode: 'CPU',
  },
  {
    id: 40,
    module: 'CPU Components',
    question: 'What is the role of the accumulator register?',
    options: ['Store memory addresses', 'Control CPU timing', 'Hold intermediate ALU results', 'Store program instructions permanently'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'CPU',
  },
  {
    id: 41,
    module: 'Pipelining and Hazards',
    question: 'A CPU improves throughput by overlapping work so different instructions are in different stages (fetch, decode, execute, etc.) at the same time. What CPU technique is being used?',
    options: ['Executing one instruction at a time', 'Dividing instructions into stages executed in parallel', 'Storing instructions in memory', 'Reducing CPU clock speed'],
    correctAnswerIndex: 1,
    bloomLevel: 'Analyze',
    competencyCode: 'PIPE',
  },
  {
    id: 42,
    module: 'Pipelining and Hazards',
    question: 'What is the main purpose of pipelining?',
    options: ['Increase memory size', 'Reduce instruction execution stages', 'Enhance overall CPU performance', 'Eliminate instruction decoding'],
    correctAnswerIndex: 2,
    bloomLevel: 'Analyze',
    competencyCode: 'PIPE',
  },
  {
    id: 43,
    module: 'Pipelining and Hazards',
    question: 'In a pipeline processor, what happens to multiple instructions?',
    options: ['They are ignored', 'They are processed sequentially only', 'They are processed simultaneously in different stages', 'They are stored permanently'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'PIPE',
  },
  {
    id: 44,
    module: 'Pipelining and Hazards',
    question: 'In a pipelined CPU, each stage must pass its intermediate results to the next stage on every clock cycle. Which component holds these intermediate values between stages?',
    options: ['Perform arithmetic operations', 'Store intermediate data between stages', 'Execute instructions', 'Control input devices'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'PIPE',
  },
  {
    id: 45,
    module: 'Pipelining and Hazards',
    question: 'What controls all stages and registers in a pipeline?',
    options: ['ALU', 'Cache', 'Control Unit', 'Memory Unit'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'PIPE',
  },
  {
    id: 46,
    module: 'Pipelining and Hazards',
    question: 'Which stage involves fetching the instruction into the instruction register?',
    options: ['Decode', 'Execute', 'Fetch', 'Store'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'PIPE',
  },
  {
    id: 47,
    module: 'Pipelining and Hazards',
    question: 'What occurs during the decode stage?',
    options: ['Instruction is executed', 'Instruction is interpreted', 'Data is stored', 'Memory is cleared'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'PIPE',
  },
  {
    id: 48,
    module: 'Pipelining and Hazards',
    question: 'What is the result after all pipeline stages are completed?',
    options: ['Input data', 'Intermediate data', 'Final output', 'Cache data'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'PIPE',
  },
  {
    id: 49,
    module: 'Pipelining and Hazards',
    question: 'What type of processing does pipelining represent?',
    options: ['Sequential processing', 'Parallel processing', 'Batch processing', 'Manual processing'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'PIPE',
  },
  {
    id: 50,
    module: 'Pipelining and Hazards',
    question: 'What is latency in pipelining?',
    options: ['Number of instructions per second', 'Time to complete one instruction', 'Size of pipeline stages', 'Number of registers used'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'PIPE',
  },
  {
    id: 51,
    module: 'Pipelining and Hazards',
    question: 'What is the main advantage of pipelining compared to non-pipelined execution?',
    options: ['Simpler design', 'Lower cost', 'Higher throughput', 'Fewer instructions'],
    correctAnswerIndex: 2,
    bloomLevel: 'Analyze',
    competencyCode: 'PIPE',
  },
  {
    id: 52,
    module: 'Pipelining and Hazards',
    question: 'What happens in a non-pipelined CPU during instruction execution?',
    options: ['Multiple instructions are executed simultaneously', 'CPU components remain idle during parts of the cycle', 'All stages run in parallel', 'No decoding occurs'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'PIPE',
  },
  {
    id: 53,
    module: 'Pipelining and Hazards',
    question: 'What is the structure of an assembly instruction?',
    options: ['Input and output', 'Opcode and operand', 'Address and register', 'Cache and memory'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'PIPE',
  },
  {
    id: 54,
    module: 'Pipelining and Hazards',
    question: 'What is immediate addressing?',
    options: ['Operand is a memory address', 'Operand is the actual value', 'Operand is stored in cache', 'Operand is ignored'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'PIPE',
  },
  {
    id: 55,
    module: 'Pipelining and Hazards',
    question:
      'You are optimizing hot code on a pipelined CPU where a data-memory access can cost tens of cycles on a cache miss. To maximize pipeline throughput, which operand/addressing choice is the BEST for the most frequently executed operations?',
    options: [
      'Prefer register and immediate operands; load once and reuse values from registers in the hot loop',
      'Use direct memory operands for most ALU operations so each instruction reads operands from memory when needed',
      'Use complex addressing modes to reduce instruction count even if they increase memory traffic for hot paths',
      'Rely on frequent memory operands to minimize register usage, accepting more load/use stalls in the pipeline',
    ],
    correctAnswerIndex: 0,
    bloomLevel: 'Evaluate',
    competencyCode: 'PIPE',
  },
  {
    id: 56,
    module: 'Pipelining and Hazards',
    question: 'A 5-stage pipelined CPU uses a single memory port for both instruction fetch and data access, causing frequent stalls on loads and stores. With limited extra area available, which redesign would you implement to remove the root cause?',
    options: [
      'Use separate instruction and data caches (or a dual-ported cache) to allow simultaneous access',
      'Add data forwarding paths to resolve RAW hazards',
      'Add branch prediction to reduce control hazards',
      'Increase pipeline depth to reduce the clock period',
    ],
    correctAnswerIndex: 0,
    bloomLevel: 'Evaluate',
    competencyCode: 'PIPE',
  },
  {
    id: 57,
    module: 'Pipelining and Hazards',
    question: 'What type of hazard occurs when instructions depend on previous results?',
    options: ['Structural hazard', 'Data hazard', 'Control hazard', 'Memory hazard'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'PIPE',
  },
  {
    id: 58,
    module: 'Pipelining and Hazards',
    question: 'Which hazard is caused by branch instructions?',
    options: ['Data hazard', 'Structural hazard', 'Control hazard', 'Execution hazard'],
    correctAnswerIndex: 2,
    bloomLevel: 'Analyze',
    competencyCode: 'PIPE',
  },
  {
    id: 59,
    module: 'Pipelining and Hazards',
    question: 'What does throughput measure in pipelining?',
    options: ['Time per instruction', 'Number of instructions completed per unit time', 'Size of memory', 'Number of pipeline stages'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'PIPE',
  },
  {
    id: 60,
    module: 'Pipelining and Hazards',
    question: 'What is one disadvantage of pipelining?',
    options: ['Low efficiency', 'Simple design', 'Complex implementation', 'Reduced performance'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'PIPE',
  },
])

const MIDTERM_DIAGNOSTIC_QUESTION_BANK: DiagnosticQuestion[] = addWeights([
  {
    id: 61,
    module: 'Cache Organization',
    question: 'What is the primary purpose of cache memory in a computer system?',
    options: ['To store permanent data', 'To reduce the average time to access data from main memory', 'To replace CPU registers', 'To increase disk storage capacity'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'CM',
  },
  {
    id: 62,
    module: 'Cache Organization',
    question:
      'You are tuning an embedded system with strict power limits where DRAM latency is a bottleneck. The software is fixed (you cannot restructure data or manually manage a scratchpad). You need the BEST way to reduce average data access latency without increasing DRAM power. Which change should you choose?',
    options: [
      'Add a small on-chip cache close to the CPU to exploit locality and reduce average access time',
      'Add a small software-managed scratchpad SRAM and require the application to explicitly copy hot data in/out',
      'Add an aggressive hardware prefetcher that increases DRAM traffic to hide latency',
      'Select a lower-latency DRAM timing profile/grade within the same power envelope (e.g., lower CAS latency)',
    ],
    correctAnswerIndex: 0,
    bloomLevel: 'Evaluate',
    competencyCode: 'CM',
  },
  {
    id: 63,
    module: 'Cache Organization',
    question: 'What occurs during a cache miss?',
    options: ['Data is fetched from main memory', 'Cache is cleared', 'CPU halts processing', 'Data is deleted permanently'],
    correctAnswerIndex: 0,
    bloomLevel: 'Remember',
    competencyCode: 'CM',
  },
  {
    id: 64,
    module: 'Cache Organization',
    question: 'When comparing two cache designs, which metric most directly captures how often requests are served by the cache instead of main memory?',
    options: ['Clock frequency', 'Bandwidth', 'Hit ratio', 'Latency rate'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'CM',
  },
  {
    id: 65,
    module: 'Cache Organization',
    question: 'In direct mapping, what happens when two memory blocks map to the same cache line?',
    options: ['Both are stored simultaneously', 'One block overwrites the other', 'Cache expands automatically', 'CPU ignores both blocks'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'CM',
  },
  {
    id: 66,
    module: 'Cache Organization',
    question: 'You are decoding a cache address split into tag/index/offset fields. Which field uniquely identifies which memory block is currently stored in a cache line?',
    options: ['Offset', 'Index', 'Register', 'Tag'],
    correctAnswerIndex: 3,
    bloomLevel: 'Apply',
    competencyCode: 'CM',
  },
  {
    id: 67,
    module: 'Cache Organization',
    question: 'What is the main advantage of fully associative mapping?',
    options: ['Simpler implementation', 'Faster indexing', 'Flexibility in block placement', 'Lower hardware cost'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'CM',
  },
  {
    id: 68,
    module: 'Cache Organization',
    question:
      'You are choosing a cache mapping scheme for an L1 cache. You need better hit rate than direct-mapped, but you cannot afford the full comparator/tag-search hardware of fully associative. Which mapping is the BEST compromise?',
    options: [
      'Direct mapping (1-way)',
      'Fully associative mapping',
      'Set-associative mapping (limited associativity, e.g., 2- or 4-way)',
      'Pseudo-associative mapping (probe an alternate location on a miss)',
    ],
    correctAnswerIndex: 2,
    bloomLevel: 'Evaluate',
    competencyCode: 'CM',
  },
  {
    id: 69,
    module: 'Cache Organization',
    question: 'A loop repeatedly updates the same few variables, leading to many cache hits even though the program runs for a long time. Which locality principle explains this behavior?',
    options: ['Spatial locality', 'Logical locality', 'Temporal locality', 'Sequential locality'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'CM',
  },
  {
    id: 70,
    module: 'Cache Organization',
    question: 'Why is cache memory more expensive than main memory?',
    options: ['It stores permanent data', 'It uses faster and more complex hardware', 'It has larger capacity', 'It requires less power'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'CM',
  },
  {
    id: 71,
    module: 'Cache Organization',
    question: 'A game engine must hit 60 FPS on a CPU with small caches. You can either keep entity data in scattered object graphs or restructure data for more contiguous access. Which reasoning BEST supports moving away from traditional object-oriented design for cache efficiency?',
    options: [
      'It reduces branch mispredictions by eliminating virtual function calls in gameplay code',
      'It improves instruction-cache locality because fewer unique methods are executed per frame',
      'It improves spatial locality by storing hot component fields contiguously, reducing cache misses from pointer chasing',
      'It reduces memory usage primarily by eliminating dynamic allocation entirely at runtime',
    ],
    correctAnswerIndex: 2,
    bloomLevel: 'Evaluate',
    competencyCode: 'CM',
  },
  {
    id: 72,
    module: 'Cache Organization',
    question: 'What is a key benefit of data-oriented design for caching?',
    options: ['It groups related data contiguously', 'It eliminates memory usage', 'It reduces CPU frequency', 'It increases disk storage'],
    correctAnswerIndex: 0,
    bloomLevel: 'Understand',
    competencyCode: 'CM',
  },
  {
    id: 73,
    module: 'Cache Organization',
    question: 'What defines a cache hit?',
    options: ['Data is retrieved from main memory', 'Data is found in the cache', 'Cache memory is cleared', 'CPU skips execution'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'CM',
  },
  {
    id: 74,
    module: 'Cache Organization',
    question: 'A CPU has 64-byte cache lines and your code is memory-bound. Which access pattern is the BEST choice to exploit spatial locality and reduce cache misses?',
    options: [
      'Use a large fixed stride (e.g., every 64th element) so each access lands in a different cache line',
      'Use an index array to access elements in a pseudo-random order (e.g., hash table style)',
      'Access consecutive memory addresses (unit-stride) so each fetched cache line supplies many useful elements',
      'Interleave accesses across multiple far-apart arrays so each iteration touches many distinct cache lines',
    ],
    correctAnswerIndex: 2,
    bloomLevel: 'Evaluate',
    competencyCode: 'CM',
  },
  {
    id: 75,
    module: 'Cache Organization',
    question: 'What is the commonly used size of a cache line?',
    options: ['32 bytes', '16 bytes', '128 bytes', '64 bytes'],
    correctAnswerIndex: 3,
    bloomLevel: 'Apply',
    competencyCode: 'CM',
  },
  {
    id: 76,
    module: 'Cache Organization',
    question: 'In an n-way set associative cache, what does "n" represent?',
    options: ['Number of CPUs', 'Number of sets', 'Number of lines per set', 'Number of memory blocks'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'CM',
  },
  {
    id: 77,
    module: 'Cache Organization',
    question: 'Which cache level is typically the fastest and smallest?',
    options: ['L2', 'L3', 'Main memory', 'L1'],
    correctAnswerIndex: 3,
    bloomLevel: 'Remember',
    competencyCode: 'CM',
  },
  {
    id: 78,
    module: 'Cache Organization',
    question: 'Why do CPUs prefetch adjacent data?',
    options: ['To reduce power usage', 'To exploit spatial locality', 'To increase storage', 'To avoid cache usage'],
    correctAnswerIndex: 1,
    bloomLevel: 'Analyze',
    competencyCode: 'CM',
  },
  {
    id: 79,
    module: 'Cache Organization',
    question: 'You are considering a fully associative cache to reduce misses, but your design has tight area and timing constraints. Which statement BEST captures the trade-off of fully associative caches?',
    options: ['Low flexibility but high speed', 'High flexibility but increased complexity', 'Low cost but high miss rate', 'Large size but slow access'],
    correctAnswerIndex: 1,
    bloomLevel: 'Evaluate',
    competencyCode: 'CM',
  },
  {
    id: 80,
    module: 'Cache Organization',
    question: 'Why are n-way set associative caches commonly used in real systems?',
    options: ['They eliminate all cache misses', 'They require no hardware', 'They maximize storage capacity', 'They balance speed and flexibility'],
    correctAnswerIndex: 3,
    bloomLevel: 'Understand',
    competencyCode: 'CM',
  },
  {
    id: 81,
    module: 'Virtual Memory and ECC',
    question: 'What is the main purpose of virtual memory in an operating system?',
    options: ['To increase CPU speed', 'To provide a large continuous memory illusion', 'To store permanent files', 'To replace secondary storage'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'VM',
  },
  {
    id: 82,
    module: 'Virtual Memory and ECC',
    question: 'Two user programs run at the same time. If both could write directly to physical addresses, one program could corrupt the other\'s data or code. Why is this unsafe?',
    options: ['It reduces system performance', 'It increases memory size', 'It allows processes to overwrite each other\'s memory', 'It prevents multitasking'],
    correctAnswerIndex: 2,
    bloomLevel: 'Analyze',
    competencyCode: 'VM',
  },
  {
    id: 83,
    module: 'Virtual Memory and ECC',
    question: 'What type of fragmentation occurs when free memory is split into non-contiguous blocks?',
    options: ['Internal fragmentation', 'Logical fragmentation', 'Cache fragmentation', 'External fragmentation'],
    correctAnswerIndex: 3,
    bloomLevel: 'Remember',
    competencyCode: 'VM',
  },
  {
    id: 84,
    module: 'Virtual Memory and ECC',
    question: 'Why might a program requesting 350 MB fail even if 474 MB total free memory exists?',
    options: ['Memory is too slow', 'Memory is not contiguous', 'CPU is overloaded', 'Disk space is insufficient'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'VM',
  },
  {
    id: 85,
    module: 'Virtual Memory and ECC',
    question: 'A 32-bit system uses 32-bit addresses for memory locations. In the simplest case, what is the maximum amount of addressable memory space?',
    options: ['Limited to 2 GB RAM', 'Cannot run multiple programs', 'Limited to 4 GB addressable memory', 'Cannot use virtual memory'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'VM',
  },
  {
    id: 86,
    module: 'Virtual Memory and ECC',
    question: 'How does virtual memory improve system security?',
    options: ['By increasing RAM size', 'By isolating processes in separate address spaces', 'By removing disk usage', 'By speeding up CPU operations'],
    correctAnswerIndex: 1,
    bloomLevel: 'Analyze',
    competencyCode: 'VM',
  },
  {
    id: 87,
    module: 'Virtual Memory and ECC',
    question: 'What is the role of the Memory Management Unit (MMU)?',
    options: ['To store program instructions', 'To manage disk storage', 'To translate virtual addresses to physical addresses', 'To execute programs'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'VM',
  },
  {
    id: 88,
    module: 'Virtual Memory and ECC',
    question:
      'An OS must keep applications running during memory pressure instead of terminating them, even if performance drops due to disk I/O. Which mechanism is the BEST match for swapping?',
    options: [
      'Compress cold pages in RAM to avoid disk I/O at the cost of extra CPU time',
      'Move inactive pages/process memory between RAM and disk (swap space) to free physical memory',
      'Increase cache size so applications stop allocating as much heap memory',
      'Disable virtual memory so applications must fit entirely in physical RAM',
    ],
    correctAnswerIndex: 1,
    bloomLevel: 'Evaluate',
    competencyCode: 'VM',
  },
  {
    id: 89,
    module: 'Virtual Memory and ECC',
    question: 'Which concept allows programs larger than physical memory to run?',
    options: ['Segmentation', 'Paging', 'Virtual memory', 'Cache mapping'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'VM',
  },
  {
    id: 90,
    module: 'Virtual Memory and ECC',
    question: 'What is a major disadvantage of virtual memory?',
    options: ['Increased cost of RAM', 'Slower performance due to disk access', 'Reduced memory capacity', 'Elimination of multitasking'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'VM',
  },
  {
    id: 91,
    module: 'Virtual Memory and ECC',
    question: 'What problem arises when multiple copies of the same library are loaded into memory?',
    options: ['Increased CPU usage', 'Memory wastage', 'Faster execution', 'Reduced fragmentation'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'VM',
  },
  {
    id: 92,
    module: 'Virtual Memory and ECC',
    question: 'An OS must support many processes safely. RAM has enough total free space but it is fragmented, and you must avoid long pauses from compaction. Which memory-management approach is the best choice?',
    options: [
      'Compaction to make free memory contiguous',
      'Paging using fixed-size pages and frames',
      'Require all allocations to be contiguous and deny requests otherwise',
      'Segmentation with variable-sized segments, accepting external fragmentation unless compaction is performed',
    ],
    correctAnswerIndex: 1,
    bloomLevel: 'Evaluate',
    competencyCode: 'VM',
  },
  {
    id: 93,
    module: 'Virtual Memory and ECC',
    question: 'What is a page in virtual memory?',
    options: ['A variable-sized memory block', 'A fixed-size block of virtual memory', 'A CPU register', 'A disk partition'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'VM',
  },
  {
    id: 94,
    module: 'Virtual Memory and ECC',
    question: 'What is a frame in memory management?',
    options: ['A block of virtual memory', 'A disk storage unit', 'A fixed-size block of physical memory', 'A CPU instruction set'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'VM',
  },
  {
    id: 95,
    module: 'Virtual Memory and ECC',
    question:
      'An OS adopts paging to eliminate external fragmentation and avoid expensive compaction, but memory is tight and many allocations are smaller than a page. Which trade-off is the BEST description of what paging can introduce?',
    options: [
      'External fragmentation',
      'More disk I/O due to swapping',
      'Internal fragmentation (wasted space within the last page)',
      'Additional overhead for page tables and TLB misses',
    ],
    correctAnswerIndex: 2,
    bloomLevel: 'Evaluate',
    competencyCode: 'VM',
  },
  {
    id: 96,
    module: 'Virtual Memory and ECC',
    question: 'What is demand paging?',
    options: ['Loading entire programs into memory', 'Loading pages only when needed', 'Deleting unused memory', 'Allocating fixed memory blocks'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'VM',
  },
  {
    id: 97,
    module: 'Virtual Memory and ECC',
    question: 'How do shared pages improve memory efficiency?',
    options: ['By duplicating code across processes', 'By storing data permanently', 'By allowing multiple processes to use the same memory block', 'By reducing CPU speed'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'VM',
  },
  {
    id: 98,
    module: 'Virtual Memory and ECC',
    question: 'What are the two main components of a memory address in paging?',
    options: ['Segment and offset', 'Tag and index', 'Page number and offset', 'Frame and block'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'VM',
  },
  {
    id: 99,
    module: 'Virtual Memory and ECC',
    question: 'Why does virtual memory allow better multitasking?',
    options: ['It increases CPU clock speed', 'It allows more programs to run simultaneously', 'It removes disk usage', 'It simplifies hardware design'],
    correctAnswerIndex: 1,
    bloomLevel: 'Analyze',
    competencyCode: 'VM',
  },
  {
    id: 100,
    module: 'Virtual Memory and ECC',
    question: 'Which best explains how virtual memory handles insufficient RAM?',
    options: ['It compresses data in RAM', 'It deletes inactive programs', 'It uses disk space as an extension of memory', 'It increases cache size'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'VM',
  },
  {
    id: 101,
    module: 'Advanced Execution',
    question: 'What does Instruction-Level Parallelism (ILP) primarily enable in processors?',
    options: ['Execution of multiple instructions simultaneously', 'Expansion of memory capacity', 'Reduction of disk usage', 'Elimination of pipelines'],
    correctAnswerIndex: 0,
    bloomLevel: 'Remember',
    competencyCode: 'ILP',
  },
  {
    id: 102,
    module: 'Advanced Execution',
    question: 'ILP operates within which scope of computing hardware?',
    options: ['Multiple distributed systems', 'A single processor', 'Entire network architecture', 'External storage devices'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'ILP',
  },
  {
    id: 103,
    module: 'Advanced Execution',
    question: 'Which factor limits the effectiveness of ILP the most?',
    options: ['Clock speed', 'Cache size', 'Data dependencies between instructions', 'Disk latency'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'ILP',
  },
  {
    id: 104,
    module: 'Advanced Execution',
    question: 'To reduce stalls, a compiler reorders independent instructions and schedules them so more operations can execute each cycle. What compiler role in ILP does this describe?',
    options: ['Controls memory allocation only', 'Executes instructions directly', 'Manages hardware registers', 'Determines instruction execution order and scheduling'],
    correctAnswerIndex: 3,
    bloomLevel: 'Analyze',
    competencyCode: 'ILP',
  },
  {
    id: 105,
    module: 'Advanced Execution',
    question: 'Which type of architecture explicitly defines dependencies between operations?',
    options: ['Sequential architecture', 'Independence architecture', 'Dependence architecture', 'Superscalar architecture'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'ILP',
  },
  {
    id: 106,
    module: 'Advanced Execution',
    question: 'What is the primary advantage of ILP?',
    options: ['Reduced hardware complexity', 'Improved processor performance', 'Lower memory usage', 'Elimination of instruction latency'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'ILP',
  },
  {
    id: 107,
    module: 'Advanced Execution',
    question: 'When scheduling instructions to avoid hazards, the compiler inserts operations that do nothing but consume a cycle so dependent instructions can wait safely. What is this instruction used for?',
    options: ['To execute arithmetic operations', 'To represent idle processor cycles', 'To store data', 'To increase clock speed'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'ILP',
  },
  {
    id: 108,
    module: 'Advanced Execution',
    question: 'What is required to execute multiple operations in a single cycle in ILP?',
    options: ['Larger RAM', 'Faster disk', 'Fewer instructions', 'Multiple functional units'],
    correctAnswerIndex: 3,
    bloomLevel: 'Apply',
    competencyCode: 'ILP',
  },
  {
    id: 109,
    module: 'Advanced Execution',
    question: 'Which is a disadvantage of ILP?',
    options: ['Reduced throughput', 'Increased energy efficiency', 'Increased hardware complexity', 'Lower performance'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'ILP',
  },
  {
    id: 110,
    module: 'Advanced Execution',
    question: 'What happens in sequential execution compared to ILP?',
    options: ['Only one instruction executes per cycle', 'Multiple instructions execute per cycle', 'Instructions execute out of order', 'No dependencies exist'],
    correctAnswerIndex: 0,
    bloomLevel: 'Understand',
    competencyCode: 'ILP',
  },
  {
    id: 111,
    module: 'Advanced Execution',
    question: 'You are comparing two compiler optimizations. To predict which version runs faster on the same CPU, which set of factors should you analyze to determine execution time?',
    options: ['Cache size, RAM size, disk speed', 'Instruction count, CPI, clock cycle time', 'CPU cores, threads, memory size', 'Bandwidth, latency, throughput'],
    correctAnswerIndex: 1,
    bloomLevel: 'Analyze',
    competencyCode: 'ILP',
  },
  {
    id: 112,
    module: 'Advanced Execution',
    question: 'What is the ideal CPI in a perfectly functioning pipeline?',
    options: ['0', '2', '1', '4'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'ILP',
  },
  {
    id: 113,
    module: 'Advanced Execution',
    question: 'What causes pipeline stalls in a processor?',
    options: ['Faster memory access', 'Instruction dependencies and hazards', 'Increased clock speed', 'Reduced instruction count'],
    correctAnswerIndex: 1,
    bloomLevel: 'Analyze',
    competencyCode: 'ILP',
  },
  {
    id: 114,
    module: 'Advanced Execution',
    question: 'A CPU team can increase pipeline depth to raise clock frequency, but branch mispredictions and hazards will cost more cycles per event. Which option is the BEST description of this trade-off?',
    options: [
      'Improves clock frequency, but requires more bypass paths and control logic that can increase design complexity and power',
      'Improves clock frequency, but reduces the branch-misprediction penalty because each stage does less work',
      'Reduces clock period, but increases the cycles lost per misprediction/stall because the pipeline has more stages to flush or wait',
      'Improves clock frequency without materially affecting CPI or the cost of hazards and mispredictions',
    ],
    correctAnswerIndex: 2,
    bloomLevel: 'Evaluate',
    competencyCode: 'ILP',
  },
  {
    id: 115,
    module: 'Advanced Execution',
    question:
      'A CPU core frequently waits on cache misses in a mostly single-threaded workload, and you cannot increase clock speed due to thermal limits. To improve throughput, which capability is the BEST choice to keep useful work running while some instructions are stalled?',
    options: [
      'Use strict in-order issue/execute to keep the design simple, accepting that one long-latency miss blocks following work',
      'Allow independent instructions to execute before stalled ones when their operands are ready (out-of-order execution)',
      'Add simultaneous multithreading (SMT) so another thread can run while one thread waits on memory',
      'Increase pipeline depth to raise frequency so stalls become a smaller fraction of total time',
    ],
    correctAnswerIndex: 1,
    bloomLevel: 'Evaluate',
    competencyCode: 'ILP',
  },
  {
    id: 116,
    module: 'Advanced Execution',
    question: 'Which hazard involves reading a value before it is written?',
    options: ['WAR', 'WAW', 'RAW', 'Control hazard'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'ILP',
  },
  {
    id: 117,
    module: 'Advanced Execution',
    question: 'In out-of-order execution, false dependencies cause WAR and WAW hazards even when instructions are logically independent. Which technique removes these hazards?',
    options: ['Branch prediction', 'Register renaming', 'Cache mapping', 'Pipelining'],
    correctAnswerIndex: 1,
    bloomLevel: 'Analyze',
    competencyCode: 'ILP',
  },
  {
    id: 118,
    module: 'Advanced Execution',
    question: 'What is the purpose of a reorder buffer?',
    options: ['To store cache data', 'To maintain correct instruction execution order', 'To increase memory size', 'To reduce clock cycles'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'ILP',
  },
  {
    id: 119,
    module: 'Advanced Execution',
    question: 'Why is branch prediction important in pipelines?',
    options: ['It reduces memory usage', 'It helps keep the pipeline filled with useful instructions', 'It increases instruction size', 'It eliminates hazards completely'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'ILP',
  },
  {
    id: 120,
    module: 'Advanced Execution',
    question: 'What limits further performance gains in modern pipelines?',
    options: ['Unlimited memory', 'Reduced instruction count', 'Increasing power consumption and complexity', 'Faster disk speed'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'ILP',
  },
])

const FINAL_DIAGNOSTIC_QUESTION_BANK: DiagnosticQuestion[] = addWeights([
  {
    id: 121,
    module: 'Architecture Fundamentals',
    question:
      'You are designing a microcontroller that must fetch an instruction and access data in the same cycle to hit a throughput target. You can afford extra hardware complexity. Which architecture is the BEST choice?',
    options: [
      'Harvard-style: separate instruction and data memories/buses enabling parallel fetch and data access',
      'Von Neumann-style: a unified memory/bus shared by instructions and data',
      'Von Neumann-style with a deeper pipeline to hide the shared-bus bottleneck',
      'Von Neumann-style with a larger unified cache but still a single shared path to memory',
    ],
    correctAnswerIndex: 0,
    bloomLevel: 'Evaluate',
    competencyCode: 'AF',
  },
  {
    id: 122,
    module: 'Architecture Fundamentals',
    question: 'Who designed the Von Neumann architecture?',
    options: ['Alan Turing', 'Charles Babbage', 'John Von Neumann', 'Bill Gates'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'AF',
  },
  {
    id: 123,
    module: 'Architecture Fundamentals',
    question: 'What is one advantage of Von Neumann architecture?',
    options: ['Complex design', 'Expensive implementation', 'Limited flexibility', 'Simplicity in design'],
    correctAnswerIndex: 3,
    bloomLevel: 'Remember',
    competencyCode: 'AF',
  },
  {
    id: 124,
    module: 'Architecture Fundamentals',
    question: 'What is the main disadvantage of Von Neumann architecture?',
    options: ['Separate memory', 'High cost', 'Bottleneck due to shared bus', 'Limited instruction set'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'AF',
  },
  {
    id: 125,
    module: 'Architecture Fundamentals',
    question: 'What risk exists because data and instructions share memory in Von Neumann architecture?',
    options: ['Faster processing', 'Memory corruption', 'Reduced flexibility', 'Increased cost'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'AF',
  },
  {
    id: 126,
    module: 'Architecture Fundamentals',
    question:
      'You are designing a microcontroller that must fetch an instruction and access data in the same cycle to maximize throughput, and increased hardware complexity is acceptable. Which architecture BEST fits?',
    options: [
      'Von Neumann architecture with a single shared memory and bus',
      'Harvard architecture with separate instruction and data memories/buses',
      'Von Neumann architecture with a wider shared bus but still one shared access path',
      'Von Neumann architecture with a faster clock to compensate for the shared-bus limitation',
    ],
    correctAnswerIndex: 1,
    bloomLevel: 'Evaluate',
    competencyCode: 'AF',
  },
  {
    id: 127,
    module: 'Architecture Fundamentals',
    question: 'What is a feature of Harvard architecture?',
    options: ['Single bus system', 'Sequential data access', 'Parallel access to data and instructions', 'Unified memory space'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'AF',
  },
  {
    id: 128,
    module: 'Architecture Fundamentals',
    question:
      'You are designing a DSP that must fetch an instruction and read sample data every cycle under a strict real-time latency target. Which design choice is the BEST reason Harvard-style designs can be faster than Von Neumann?',
    options: [
      'A deeper pipeline that increases clock frequency but keeps a single shared memory/bus',
      'A larger unified cache so instructions and data share the same cache path',
      'Separate instruction and data buses (or memories) enabling parallel instruction fetch and data access',
      'A single shared bus with more aggressive branch prediction to keep the pipeline full',
    ],
    correctAnswerIndex: 2,
    bloomLevel: 'Evaluate',
    competencyCode: 'AF',
  },
  {
    id: 129,
    module: 'Architecture Fundamentals',
    question: 'What is a disadvantage of Harvard architecture?',
    options: ['Low performance', 'Complex design', 'Shared memory issue', 'Limited processing speed'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'AF',
  },
  {
    id: 130,
    module: 'Architecture Fundamentals',
    question: 'Which system typically uses Harvard architecture?',
    options: ['Personal computers', 'Small laptops', 'Microcontrollers and signal processors', 'Gaming consoles'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'AF',
  },
  {
    id: 131,
    module: 'Architecture Fundamentals',
    question: 'What is the key principle of Harvard architecture based on its origin?',
    options: ['Shared memory system', 'Separate storage for instructions and data', 'Single bus communication', 'Sequential execution only'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'AF',
  },
  {
    id: 132,
    module: 'Architecture Fundamentals',
    question: 'In Von Neumann architecture, how are instructions and data accessed?',
    options: ['Simultaneously', 'Through separate buses', 'Sequentially using the same memory and bus', 'Using multiple processors'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'AF',
  },
  {
    id: 133,
    module: 'Architecture Fundamentals',
    question: 'What is the Von Neumann bottleneck?',
    options: ['Lack of memory', 'Slow processor speed', 'Limitation caused by shared memory and bus', 'Excessive cache usage'],
    correctAnswerIndex: 2,
    bloomLevel: 'Analyze',
    competencyCode: 'AF',
  },
  {
    id: 134,
    module: 'Architecture Fundamentals',
    question: 'How does Harvard architecture solve the bottleneck issue?',
    options: ['Uses slower memory', 'Uses single bus', 'Separates instruction and data pathways', 'Reduces clock speed'],
    correctAnswerIndex: 2,
    bloomLevel: 'Analyze',
    competencyCode: 'AF',
  },
  {
    id: 135,
    module: 'Architecture Fundamentals',
    question: 'What type of memory is typically used for instructions in Harvard architecture?',
    options: ['RAM', 'ROM', 'Cache', 'Register'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'AF',
  },
  {
    id: 136,
    module: 'Architecture Fundamentals',
    question: 'Where is Harvard architecture commonly applied?',
    options: ['Desktop computers', 'Word processors', 'Digital signal processors', 'Web servers'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'AF',
  },
  {
    id: 137,
    module: 'Architecture Fundamentals',
    question: 'What is the purpose of splitting L1 cache in modern CPUs?',
    options: ['Reduce memory size', 'Separate instruction and data access', 'Increase cost', 'Simplify architecture'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'AF',
  },
  {
    id: 138,
    module: 'Architecture Fundamentals',
    question: 'What is the advantage of modified Harvard architecture?',
    options: ['Sequential execution', 'Reduced cache size', 'Simultaneous instruction and data access', 'Lower processing speed'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'AF',
  },
  {
    id: 139,
    module: 'Architecture Fundamentals',
    question: 'What type of memory is used for data in Harvard architecture?',
    options: ['ROM', 'RAM', 'Cache', 'Register'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'AF',
  },
  {
    id: 140,
    module: 'Architecture Fundamentals',
    question: 'What improves performance in modern CPUs inspired by Harvard architecture?',
    options: ['Single memory unit', 'Sequential instruction execution', 'Separate caches for instructions and data', 'Reduced clock cycles'],
    correctAnswerIndex: 2,
    bloomLevel: 'Analyze',
    competencyCode: 'AF',
  },
  {
    id: 141,
    module: 'Instruction Set Architecture',
    question: 'What is Instruction Set Architecture (ISA)?',
    options: ['Internal CPU design', 'Language that defines CPU operations', 'Memory management system', 'Input-output interface'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'ISA',
  },
  {
    id: 142,
    module: 'Instruction Set Architecture',
    question: 'What does ISA define in a computer system?',
    options: ['Hardware layout only', 'Communication between software and hardware', 'Cooling system design', 'Power consumption'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'ISA',
  },
  {
    id: 143,
    module: 'Instruction Set Architecture',
    question: 'Which of the following is an example of an instruction type in ISA?',
    options: ['ADD', 'Monitor', 'Keyboard', 'Fan'],
    correctAnswerIndex: 0,
    bloomLevel: 'Remember',
    competencyCode: 'ISA',
  },
  {
    id: 144,
    module: 'Instruction Set Architecture',
    question: 'Before an ALU operation, a value must be moved from memory into a register (and later stored back). Which instruction type performs this movement?',
    options: ['Perform calculations', 'Control program flow', 'Move data between memory and registers', 'Execute loops'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'ISA',
  },
  {
    id: 145,
    module: 'Instruction Set Architecture',
    question: 'Which instruction type controls program flow?',
    options: ['Arithmetic', 'Data transfer', 'Branch and jump', 'Logical'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'ISA',
  },
  {
    id: 146,
    module: 'Instruction Set Architecture',
    question: 'You are designing the instruction fetch unit for a MIPS-like CPU and must choose the fixed instruction width for the pipeline. What is the instruction length of MIPS ISA?',
    options: ['16 bits', '32 bits', '64 bits', 'Variable length'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'ISA',
  },
  {
    id: 147,
    module: 'Instruction Set Architecture',
    question: 'Which instruction format is used for arithmetic operations in MIPS?',
    options: ['I-type', 'J-type', 'R-type', 'D-type'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'ISA',
  },
  {
    id: 148,
    module: 'Instruction Set Architecture',
    question: 'What does microarchitecture describe?',
    options: ['Instruction rules', 'Software design', 'Internal CPU implementation', 'Memory capacity'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'ISA',
  },
  {
    id: 149,
    module: 'Instruction Set Architecture',
    question: 'What is one importance of ISA in computing?',
    options: ['Controls cooling system', 'Enables assembly programming', 'Increases hardware size', 'Reduces instruction types'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'ISA',
  },
  {
    id: 150,
    module: 'Instruction Set Architecture',
    question: 'What does ISA affect in system performance?',
    options: ['Screen resolution', 'CPI and execution time', 'Keyboard input speed', 'Monitor refresh rate'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'ISA',
  },
  {
    id: 151,
    module: 'Instruction Set Architecture',
    question: 'What is the main role of ISA in a computer system?',
    options: ['Manage power supply', 'Serve as interface between software and hardware', 'Control temperature', 'Store data permanently'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'ISA',
  },
  {
    id: 152,
    module: 'Instruction Set Architecture',
    question: 'What characterizes RISC architecture?',
    options: ['Complex instructions', 'Variable instruction length', 'Simple and fixed-length instructions', 'Memory-to-memory operations'],
    correctAnswerIndex: 2,
    bloomLevel: 'Analyze',
    competencyCode: 'ISA',
  },
  {
    id: 153,
    module: 'Instruction Set Architecture',
    question: 'What is a key feature of CISC architecture?',
    options: ['Fixed instruction length', 'Simple instruction set', 'Memory-to-memory operations', 'Limited addressing modes'],
    correctAnswerIndex: 2,
    bloomLevel: 'Analyze',
    competencyCode: 'ISA',
  },
  {
    id: 154,
    module: 'Instruction Set Architecture',
    question: 'How does RISC architecture handle memory access?',
    options: ['Direct memory execution', 'Load/store operations', 'Cache-only access', 'Disk-based access'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'ISA',
  },
  {
    id: 155,
    module: 'Instruction Set Architecture',
    question: 'What is the instruction length in CISC architecture?',
    options: ['Fixed', 'Variable', 'Always 32-bit', 'Always 16-bit'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'ISA',
  },
  {
    id: 156,
    module: 'Instruction Set Architecture',
    question: 'You are designing a deeply pipelined CPU and want simple, regular instructions to keep decode fast and hazards manageable at high clock speeds. Which architecture style is the BEST fit?',
    options: ['CISC', 'RISC', 'Stack-based', 'EPIC'],
    correctAnswerIndex: 1,
    bloomLevel: 'Evaluate',
    competencyCode: 'ISA',
  },
  {
    id: 157,
    module: 'Instruction Set Architecture',
    question: 'What does the opcode represent in an instruction?',
    options: ['Data value', 'Memory address', 'Operation to perform', 'Register size'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'ISA',
  },
  {
    id: 158,
    module: 'Instruction Set Architecture',
    question: 'What is the purpose of the operand in an instruction?',
    options: ['Define operation', 'Provide data or address', 'Control CPU speed', 'Manage cache'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'ISA',
  },
  {
    id: 159,
    module: 'Instruction Set Architecture',
    question: 'Which instruction format is used for jump operations?',
    options: ['R-type', 'I-type', 'J-type', 'M-type'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'ISA',
  },
  {
    id: 160,
    module: 'Instruction Set Architecture',
    question:
      'You are choosing an ISA for a high-frequency pipelined CPU where the front-end decode budget is tight and consistent instruction timing matters. Which option is the BEST choice and justification?',
    options: [
      'Choose RISC: simpler, typically fixed-length instructions that are easier to pipeline',
      'Choose CISC: complex, variable-length instructions reduce instruction count so decode work per cycle is lower',
      'Choose CISC: higher code density reduces instruction fetch bandwidth, so decode simplicity is less important',
      'Choose either: ISA instruction formats do not materially affect decode complexity in a high-frequency pipeline',
    ],
    correctAnswerIndex: 0,
    bloomLevel: 'Evaluate',
    competencyCode: 'ISA',
  },
  {
    id: 161,
    module: 'Performance Analysis',
    question: 'What does Amdahl\'s Law explain?',
    options: ['Memory hierarchy design', 'Speedup of a system when part is improved', 'Instruction execution cycle', 'Cache performance'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'PA',
  },
  {
    id: 162,
    module: 'Performance Analysis',
    question: 'Who proposed Amdahl\'s Law?',
    options: ['Alan Turing', 'John Von Neumann', 'Gene Amdahl', 'Charles Babbage'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'PA',
  },
  {
    id: 163,
    module: 'Performance Analysis',
    question: 'A program is partially parallelized, but even with many processors the total speedup stops improving after a point. According to Amdahl\'s Law, what most fundamentally limits the speedup?',
    options: ['Parallel portion', 'Clock frequency', 'Number of processors', 'Sequential portion'],
    correctAnswerIndex: 3,
    bloomLevel: 'Analyze',
    competencyCode: 'PA',
  },
  {
    id: 164,
    module: 'Performance Analysis',
    question: 'What does P represent in Amdahl\'s Law?',
    options: ['Number of processors', 'Fraction of program that can be parallelized', 'Execution time', 'Clock cycles'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'PA',
  },
  {
    id: 165,
    module: 'Performance Analysis',
    question: 'What does N represent in Amdahl\'s Law?',
    options: ['Instruction count', 'Number of processors', 'Clock speed', 'Memory size'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'PA',
  },
  {
    id: 166,
    module: 'Performance Analysis',
    question:
      "A team wants to keep buying more processors to speed up a workload, but the sequential portion of the program cannot be reduced. As the number of processors N approaches infinity, what happens to the overall speedup (per Amdahl's Law)?",
    options: [
      'It continues to increase almost linearly with N',
      'It approaches a fixed maximum determined by the sequential fraction',
      'It eventually decreases because adding processors always makes the program slower',
      'It stays exactly the same as the 1-processor performance',
    ],
    correctAnswerIndex: 1,
    bloomLevel: 'Evaluate',
    competencyCode: 'PA',
  },
  {
    id: 167,
    module: 'Performance Analysis',
    question: 'What is the main advantage of Amdahl\'s Law?',
    options: ['Increases clock speed', 'Eliminates bottlenecks', 'Provides performance limit estimation', 'Reduces instruction count'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'PA',
  },
  {
    id: 168,
    module: 'Performance Analysis',
    question: 'What is one limitation of Amdahl\'s Law?',
    options: ['Ignores sequential part', 'Assumes fixed sequential portion', 'Requires infinite processors', 'Uses complex formulas'],
    correctAnswerIndex: 1,
    bloomLevel: 'Analyze',
    competencyCode: 'PA',
  },
  {
    id: 169,
    module: 'Performance Analysis',
    question: 'What does speedup measure?',
    options: ['Memory size', 'Performance improvement', 'Instruction length', 'Cache size'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'PA',
  },
  {
    id: 170,
    module: 'Performance Analysis',
    question: 'If a program is fully parallelizable (P = 1), what is the theoretical speedup?',
    options: ['Zero', 'One', 'Infinite', 'Fixed value'],
    correctAnswerIndex: 2,
    bloomLevel: 'Apply',
    competencyCode: 'PA',
  },
  {
    id: 171,
    module: 'Performance Analysis',
    question: 'A program executes 1.2 billion instructions and takes 2.4 billion CPU cycles. What is the CPI?',
    options: ['0.5', '2.0', '3.0', '4.0'],
    correctAnswerIndex: 1,
    bloomLevel: 'Apply',
    competencyCode: 'PA',
  },
  {
    id: 172,
    module: 'Performance Analysis',
    question: 'What does clock frequency represent?',
    options: ['Memory size', 'Number of clock cycles per second', 'Instruction count', 'Cache speed'],
    correctAnswerIndex: 1,
    bloomLevel: 'Understand',
    competencyCode: 'PA',
  },
  {
    id: 173,
    module: 'Performance Analysis',
    question: 'You must choose between two optimizations: one reduces instruction count but increases CPI, and the other reduces CPI but increases instruction count. On the same CPU, which factors are the BEST basis for deciding which version runs faster?',
    options: [
      'Only CPI, because instruction count does not affect runtime',
      'Number of instructions, CPI, and clock frequency',
      'Only instruction count, because CPI changes rarely matter on a fixed CPU',
      'Cache size, because a larger cache automatically makes either version faster',
    ],
    correctAnswerIndex: 1,
    bloomLevel: 'Evaluate',
    competencyCode: 'PA',
  },
  {
    id: 174,
    module: 'Performance Analysis',
    question: 'What does a lower CPI indicate?',
    options: ['Slower execution', 'Higher memory usage', 'Faster instruction execution', 'Larger instruction size'],
    correctAnswerIndex: 2,
    bloomLevel: 'Understand',
    competencyCode: 'PA',
  },
  {
    id: 175,
    module: 'Performance Analysis',
    question: 'What is a clock cycle?',
    options: ['Instruction type', 'Memory location', 'Time unit for CPU operations', 'Data transfer method'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'PA',
  },
  {
    id: 176,
    module: 'Performance Analysis',
    question: 'What is instruction mix?',
    options: ['Type of CPU', 'Distribution of instruction types in a program', 'Memory layout', 'Cache size'],
    correctAnswerIndex: 1,
    bloomLevel: 'Remember',
    competencyCode: 'PA',
  },
  {
    id: 177,
    module: 'Performance Analysis',
    question: 'A program has an instruction mix dominated by load/store operations, leading to a high average CPI at a fixed clock frequency. You can implement only one optimization this sprint. Which change best reduces the average CPI without increasing clock frequency?',
    options: [
      'Improve data locality (e.g., blocking/SoA) to increase cache hits and lower effective load/store CPI',
      'Aggressively unroll loops to increase ILP, even though the cache-miss rate stays the same',
      'Add software prefetches for the hot loops, increasing memory traffic to overlap latency',
      'Increase use of smaller registers/temporaries, even if it increases load/store traffic',
    ],
    correctAnswerIndex: 0,
    bloomLevel: 'Evaluate',
    competencyCode: 'PA',
  },
  {
    id: 178,
    module: 'Performance Analysis',
    question: 'What happens when clock frequency increases?',
    options: ['Execution slows down', 'Instruction count increases', 'Clock cycles become longer', 'CPU can execute more operations per second'],
    correctAnswerIndex: 3,
    bloomLevel: 'Apply',
    competencyCode: 'PA',
  },
  {
    id: 179,
    module: 'Performance Analysis',
    question: 'What does execution time formula include?',
    options: ['Memory size only', 'Cache levels', 'Instructions, CPI, and clock frequency', 'Input/output devices'],
    correctAnswerIndex: 2,
    bloomLevel: 'Remember',
    competencyCode: 'PA',
  },
  {
    id: 180,
    module: 'Performance Analysis',
    question: 'Why are memory instructions slower in CPI?',
    options: ['They use fewer cycles', 'They require additional operations', 'They are not executed', 'They reduce performance'],
    correctAnswerIndex: 1,
    bloomLevel: 'Analyze',
    competencyCode: 'PA',
  },
])

const PRETEST_ITEMS_PER_MODULE = 5

const buildPretestQuestions = (questionBank: DiagnosticQuestion[]) => {
  const questionBuckets = new Map<string, DiagnosticQuestion[]>()

  for (const question of questionBank) {
    const moduleQuestions = questionBuckets.get(question.module) ?? []
    moduleQuestions.push(question)
    questionBuckets.set(question.module, moduleQuestions)
  }

  const selectedQuestions = Array.from(questionBuckets.values()).flatMap((moduleQuestions) =>
    moduleQuestions.slice(0, PRETEST_ITEMS_PER_MODULE),
  )

  return selectedQuestions.sort((first, second) => first.id - second.id)
}

export const DIAGNOSTIC_PRETEST_QUESTIONS: DiagnosticQuestion[] = buildPretestQuestions(DIAGNOSTIC_PRETEST_QUESTION_BANK)
export const DIAGNOSTIC_PRETEST_QUESTION_POOL: DiagnosticQuestion[] = DIAGNOSTIC_PRETEST_QUESTION_BANK
export const MIDTERM_DIAGNOSTIC_QUESTION_POOL: DiagnosticQuestion[] = MIDTERM_DIAGNOSTIC_QUESTION_BANK
export const FINAL_DIAGNOSTIC_QUESTION_POOL: DiagnosticQuestion[] = FINAL_DIAGNOSTIC_QUESTION_BANK

const DIAGNOSTIC_STAGE_QUESTION_POOLS: Record<DiagnosticQuestionStage, DiagnosticQuestion[]> = {
  prelim: DIAGNOSTIC_PRETEST_QUESTION_POOL,
  midterm: MIDTERM_DIAGNOSTIC_QUESTION_POOL,
  final: FINAL_DIAGNOSTIC_QUESTION_POOL,
}

export const getDiagnosticQuestionPoolForStage = (stage: DiagnosticQuestionStage) => {
  return DIAGNOSTIC_STAGE_QUESTION_POOLS[stage] ?? DIAGNOSTIC_PRETEST_QUESTION_POOL
}

const normalizeLegacyQuestionIdForStage = (
  questionId: number,
  stage: DiagnosticQuestionStage,
) => {
  if (stage === 'midterm' && questionId >= 1001 && questionId <= 1060) {
    return questionId - 940
  }

  if (stage === 'final' && questionId >= 2001 && questionId <= 2060) {
    return questionId - 1880
  }

  return questionId
}

export const normalizeSelectedAnswersForStage = (
  selectedAnswers: Record<number, number>,
  stage: DiagnosticQuestionStage,
) => {
  const normalizedEntries = Object.entries(selectedAnswers).map(([questionId, answerIndex]) => {
    const normalizedQuestionId = normalizeLegacyQuestionIdForStage(Number(questionId), stage)
    return [normalizedQuestionId, Number(answerIndex)]
  })

  return Object.fromEntries(normalizedEntries) as Record<number, number>
}

const shuffleQuestions = (questions: DiagnosticQuestion[]) => {
  const pool = [...questions]

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = pool[index]
    pool[index] = pool[randomIndex]
    pool[randomIndex] = current
  }

  return pool
}

export const getRandomDiagnosticPretestQuestions = (
  itemsPerModule = PRETEST_ITEMS_PER_MODULE,
  stage: DiagnosticQuestionStage = 'prelim',
) => {
  const stageQuestionPool = getDiagnosticQuestionPoolForStage(stage)
  const questionBuckets = new Map<string, DiagnosticQuestion[]>()

  for (const question of stageQuestionPool) {
    const moduleQuestions = questionBuckets.get(question.module) ?? []
    moduleQuestions.push(question)
    questionBuckets.set(question.module, moduleQuestions)
  }

  const selectedQuestions = Array.from(questionBuckets.values()).flatMap((moduleQuestions) =>
    shuffleQuestions(moduleQuestions).slice(0, itemsPerModule),
  )

  return shuffleQuestions(selectedQuestions)
}

export const getDiagnosticQuestionsByIds = (questionIds: number[]) => {
  const questionById = new Map(DIAGNOSTIC_PRETEST_QUESTION_POOL.map((question) => [question.id, question]))

  return questionIds
    .map((questionId) => questionById.get(questionId))
    .filter((question): question is DiagnosticQuestion => question !== undefined)
}

export const getDiagnosticQuestionsByIdsForStage = (
  questionIds: number[],
  stage: DiagnosticQuestionStage = 'prelim',
) => {
  const stageQuestionPool = getDiagnosticQuestionPoolForStage(stage)
  const questionById = new Map(stageQuestionPool.map((question) => [question.id, question]))
  const normalizedQuestionIds = questionIds.map((questionId) => normalizeLegacyQuestionIdForStage(questionId, stage))

  return normalizedQuestionIds
    .map((questionId) => questionById.get(questionId))
    .filter((question): question is DiagnosticQuestion => question !== undefined)
}

const groupQuestionsByModule = (questions: DiagnosticQuestion[]) => {
  const questionBuckets = new Map<string, DiagnosticQuestion[]>()

  for (const question of questions) {
    const moduleQuestions = questionBuckets.get(question.module) ?? []
    moduleQuestions.push(question)
    questionBuckets.set(question.module, moduleQuestions)
  }

  return questionBuckets
}

const weightedSortForModule = (
  questions: DiagnosticQuestion[],
  selectedAnswers: Record<number, number>,
  pretestQuestionSet: Set<number>,
) => {
  return [...questions].sort((first, second) => {
    const firstIsUnseen = !pretestQuestionSet.has(first.id)
    const secondIsUnseen = !pretestQuestionSet.has(second.id)

    if (firstIsUnseen !== secondIsUnseen) {
      return firstIsUnseen ? -1 : 1
    }

    const firstIsWrong = pretestQuestionSet.has(first.id) && selectedAnswers[first.id] !== first.correctAnswerIndex
    const secondIsWrong = pretestQuestionSet.has(second.id) && selectedAnswers[second.id] !== second.correctAnswerIndex

    if (firstIsWrong !== secondIsWrong) {
      return firstIsWrong ? -1 : 1
    }

    return Math.random() - 0.5
  })
}

export const getWeightedSummativeQuestions = ({
  questionIds,
  selectedAnswers,
  itemsPerModule = 14,
  stage = 'prelim',
}: {
  questionIds: number[]
  selectedAnswers: Record<number, number>
  itemsPerModule?: number
  stage?: DiagnosticQuestionStage
}) => {
  const normalizedQuestionIds = questionIds.map((questionId) => normalizeLegacyQuestionIdForStage(questionId, stage))
  const normalizedSelectedAnswers = normalizeSelectedAnswersForStage(selectedAnswers, stage)
  const pretestQuestionSet = new Set(normalizedQuestionIds)
  const questionBuckets = groupQuestionsByModule(getDiagnosticQuestionPoolForStage(stage))

  const weightedQuestions = Array.from(questionBuckets.values()).flatMap((moduleQuestions) => {
    return weightedSortForModule(moduleQuestions, normalizedSelectedAnswers, pretestQuestionSet).slice(0, itemsPerModule)
  })

  return shuffleQuestions(weightedQuestions)
}
