 // ========== 主题面板收起功能 ==========
      let themePanelCollapsed = false;
      // 切换主题面板收起/展开
      function toggleThemePanel() {
        themePanelCollapsed = !themePanelCollapsed;
        const panel = document.getElementById("theme-panel");
        const btn = document.getElementById("collapse-btn");

        if (themePanelCollapsed) {
          panel.classList.add("collapsed");
          btn.classList.add("collapsed");
          btn.textContent = "▼"; // 向下箭头表示可展开
        } else {
          panel.classList.remove("collapsed");
          btn.classList.remove("collapsed");
          btn.textContent = "▲"; // 向上箭头表示可收起
        }

        // 保存状态
        localStorage.setItem("themePanelCollapsed", themePanelCollapsed);
      }

      // ========== 信息面板收起功能 ==========
      let infoPanelCollapsed = false; // 改为 false，默认展开

      // 切换信息面板收起/展开
      function toggleInfoPanel() {
        infoPanelCollapsed = !infoPanelCollapsed;
        const panel = document.getElementById("info-panel");
        const btn = document.getElementById("info-collapse-btn");
        const headerText = document.getElementById("info-header-text");

        if (infoPanelCollapsed) {
          panel.classList.add("collapsed");
          headerText.textContent = "关于";
        } else {
          panel.classList.remove("collapsed");
          headerText.textContent = "ℹ️ 关于";
        }

        // 保存状态
        localStorage.setItem("infoPanelCollapsed", infoPanelCollapsed);
      }

      // 加载信息面板状态
      function loadInfoPanelState() {
        const saved = localStorage.getItem("infoPanelCollapsed");
        // 只有当用户手动收起过时才恢复收起状态
        if (saved === "true") {
          infoPanelCollapsed = true;
          const panel = document.getElementById("info-panel");
          const headerText = document.getElementById("info-header-text");
          if (panel) {
            panel.classList.add("collapsed");
          }
          if (headerText) {
            headerText.textContent = "关于";
          }
        }
        // 如果没有保存记录，默认展开（不需要额外操作）
      }

      // BPM预设管理 (最多保存5个)
      let bpmPresets = [];
      const MAX_PRESETS = 5;

      // 保存当前BPM为预设
      function saveBPMPreset() {
        const currentBPM = parseInt(
          document.getElementById("bpm-slider").value
        );

        // 检查是否已存在
        const existingIndex = bpmPresets.findIndex((p) => p.bpm === currentBPM);

        if (existingIndex !== -1) {
          alert(`BPM ${currentBPM} 已存在于预设中`);
          return;
        }

        // 检查是否已满
        if (bpmPresets.length >= MAX_PRESETS) {
          alert(`最多只能保存 ${MAX_PRESETS} 个预设，请先删除旧预设`);
          return;
        }

        // 添加新预设
        bpmPresets.push({
          bpm: currentBPM,
          name: `BPM ${currentBPM}`,
        });

        // 排序
        bpmPresets.sort((a, b) => a.bpm - b.bpm);

        // 保存到localStorage
        localStorage.setItem("bpmPresets", JSON.stringify(bpmPresets));

        // 更新下拉列表
        updateBPMPresetSelect();

        alert(`已保存预设: BPM ${currentBPM}`);
      }

      // 加载BPM预设
      function loadBPMPreset() {
        const select = document.getElementById("bpm-preset-select");
        const selectedBPM = select.value;

        if (selectedBPM) {
          document.getElementById("bpm-slider").value = selectedBPM;
          updateBPM(selectedBPM);
        }
      }

      // 删除当前选中的预设
      function deleteBPMPreset() {
        const select = document.getElementById("bpm-preset-select");
        const selectedBPM = parseInt(select.value);

        if (!selectedBPM) {
          alert("请先选择要删除的预设");
          return;
        }

        if (confirm(`确定删除预设 BPM ${selectedBPM} 吗？`)) {
          bpmPresets = bpmPresets.filter((p) => p.bpm !== selectedBPM);
          localStorage.setItem("bpmPresets", JSON.stringify(bpmPresets));
          updateBPMPresetSelect();
          alert("预设已删除");
        }
      }

      // 更新BPM预设下拉列表
      function updateBPMPresetSelect() {
        const select = document.getElementById("bpm-preset-select");
        const currentValue = select.value;

        select.innerHTML = '<option value="">-- 选择预设 --</option>';

        bpmPresets.forEach((preset) => {
          const option = document.createElement("option");
          option.value = preset.bpm;
          option.textContent = preset.name;
          select.appendChild(option);
        });

        // 恢复之前的选择
        if (currentValue) {
          select.value = currentValue;
        }
      }

      // 初始化BPM预设
      function initBPMPresets() {
        const saved = localStorage.getItem("bpmPresets");
        if (saved) {
          try {
            bpmPresets = JSON.parse(saved);
          } catch (e) {
            console.error("加载BPM预设失败:", e);
            bpmPresets = [];
          }
        }
        updateBPMPresetSelect();
      }

      // initBPMPresets();

      // 加载主题面板状态
      function loadThemePanelState() {
        // 强制默认收起
        themePanelCollapsed = true;
        const panel = document.getElementById("theme-panel");
        const btn = document.getElementById("collapse-btn");

        if (panel) {
          panel.classList.add("collapsed");
        }
        if (btn) {
          btn.classList.add("collapsed");
          btn.textContent = "▼";
        }

        // 保存收起状态
        localStorage.setItem("themePanelCollapsed", "true");
      }
      // Web Audio API 初始化
      let audioContext = null;
      let audioInitialized = false;

      // 麦克风相关
      let micStream = null;
      let analyser = null;
      let dataArray = null;
      let bufferLength = 0;
      let isListening = false;
      let pitchDetectionInterval = null;

      // 音符频率映射 (A4 = 440Hz)
      const noteFrequencies = {
        C: [16.35, 32.7, 65.41, 130.81, 261.63, 523.25, 1046.5, 2093.0],
        "C#": [17.32, 34.65, 69.3, 138.59, 277.18, 554.37, 1108.73, 2217.46],
        D: [18.35, 36.71, 73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32],
        "D#": [19.45, 38.89, 77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02],
        E: [20.6, 41.2, 82.41, 164.81, 329.63, 659.25, 1318.51, 2637.02],
        F: [21.83, 43.65, 87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83],
        "F#": [23.12, 46.25, 92.5, 185.0, 369.99, 739.99, 1479.98, 2959.96],
        G: [24.5, 49.0, 98.0, 196.0, 392.0, 783.99, 1567.98, 3135.96],
        "G#": [25.96, 51.91, 103.83, 207.65, 415.3, 830.61, 1661.22, 3322.44],
        A: [27.5, 55.0, 110.0, 220.0, 440.0, 880.0, 1760.0, 3520.0],
        "A#": [29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31],
        B: [30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07],
      };

      // 初始化音频上下文
      function initAudio() {
        if (!audioContext) {
          audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          console.log("Audio Context 创建成功");
        }

        // 恢复 Audio Context (处理浏览器的自动播放策略)
        if (audioContext.state === "suspended") {
          audioContext.resume().then(() => {
            console.log("Audio Context 已恢复:", audioContext.state);
            audioInitialized = true;
            updateAudioStatus();

            // 播放一个测试音,让用户听到反馈
            playSound(880, 0.1, 0.2);
          });
        } else {
          audioInitialized = true;
          updateAudioStatus();
          console.log("Audio Context 状态:", audioContext.state);

          // 播放测试音
          playSound(880, 0.1, 0.2);
        }
      }

      // 更新音频状态显示
      function updateAudioStatus() {
        const statusDiv = document.getElementById("audio-status");
        if (
          audioInitialized &&
          audioContext &&
          audioContext.state === "running"
        ) {
          statusDiv.textContent = "🔊 音频已就绪";
          statusDiv.className = "audio-status ready";
          statusDiv.style.cursor = "default";

          // 3秒后隐藏状态提示
          setTimeout(() => {
            statusDiv.style.opacity = "0";
            statusDiv.style.pointerEvents = "none";
          }, 3000);
        } else {
          statusDiv.textContent = "🔇 点击此处启用音频";
          statusDiv.className = "audio-status warning";
          statusDiv.style.opacity = "1";
          statusDiv.style.pointerEvents = "auto";
        }
      }

      // 节拍器状态
      let metronomeRunning = false;
      let metronomeBPM = 120;
      let timeSignature = [4, 4];
      let currentBeat = 0;
      let metronomeInterval = null;
      let tapTimes = [];
      let masterVolume = 0.7; // 主音量 (0-1)
      let currentOctave = 4; // 当前选择的八度
      let isDarkMode = false; // 夜间模式状态
      let currentBackground = "rgb(255, 210, 224)"; // 当前背景色
      let currentInstrument = null; // 当前选择的乐器
      let currentTuningMode = "standard"; // 当前调音模式

      // 乐器调音配置
      const instrumentTunings = {
        guitar: {
          name: "吉他",
          icon: "🎸",
          modes: {
            standard: {
              name: "标准调弦 (E)",
              strings: [
                { number: 1, note: "E4", freq: 329.63, name: "第1弦 (最细)" },
                { number: 2, note: "B3", freq: 246.94, name: "第2弦" },
                { number: 3, note: "G3", freq: 196.0, name: "第3弦" },
                { number: 4, note: "D3", freq: 146.83, name: "第4弦" },
                { number: 5, note: "A2", freq: 110.0, name: "第5弦" },
                { number: 6, note: "E2", freq: 82.41, name: "第6弦 (最粗)" },
              ],
              description: "标准调弦,从细到粗: E-B-G-D-A-E",
            },
            dropD: {
              name: "Drop D 调弦",
              strings: [
                { number: 1, note: "E4", freq: 329.63, name: "第1弦" },
                { number: 2, note: "B3", freq: 246.94, name: "第2弦" },
                { number: 3, note: "G3", freq: 196.0, name: "第3弦" },
                { number: 4, note: "D3", freq: 146.83, name: "第4弦" },
                { number: 5, note: "A2", freq: 110.0, name: "第5弦" },
                { number: 6, note: "D2", freq: 73.42, name: "第6弦 (降D)" },
              ],
              description: "Drop D调弦,第6弦降低一个全音,适合重金属和摇滚",
            },
            halfStep: {
              name: "降半音调弦",
              strings: [
                { number: 1, note: "D#4", freq: 311.13, name: "第1弦" },
                { number: 2, note: "A#3", freq: 233.08, name: "第2弦" },
                { number: 3, note: "F#3", freq: 185.0, name: "第3弦" },
                { number: 4, note: "C#3", freq: 138.59, name: "第4弦" },
                { number: 5, note: "G#2", freq: 103.83, name: "第5弦" },
                { number: 6, note: "D#2", freq: 77.78, name: "第6弦" },
              ],
              description: "所有弦降低半音,适合某些摇滚和金属曲目",
            },
          },
        },
        bass: {
          name: "贝斯",
          icon: "🎸",
          modes: {
            standard4: {
              name: "4弦标准调弦",
              strings: [
                { number: 1, note: "G2", freq: 98.0, name: "第1弦 (最细)" },
                { number: 2, note: "D2", freq: 73.42, name: "第2弦" },
                { number: 3, note: "A1", freq: 55.0, name: "第3弦" },
                { number: 4, note: "E1", freq: 41.2, name: "第4弦 (最粗)" },
              ],
              description: "4弦贝斯标准调弦: G-D-A-E",
            },
            standard5: {
              name: "5弦标准调弦",
              strings: [
                { number: 1, note: "G2", freq: 98.0, name: "第1弦" },
                { number: 2, note: "D2", freq: 73.42, name: "第2弦" },
                { number: 3, note: "A1", freq: 55.0, name: "第3弦" },
                { number: 4, note: "E1", freq: 41.2, name: "第4弦" },
                { number: 5, note: "B0", freq: 30.87, name: "第5弦 (低音B)" },
              ],
              description: "5弦贝斯,增加低音B弦",
            },
            dropD: {
              name: "Drop D 调弦",
              strings: [
                { number: 1, note: "G2", freq: 98.0, name: "第1弦" },
                { number: 2, note: "D2", freq: 73.42, name: "第2弦" },
                { number: 3, note: "A1", freq: 55.0, name: "第3弦" },
                { number: 4, note: "D1", freq: 36.71, name: "第4弦 (降D)" },
              ],
              description: "第4弦降至D,增加低音厚度",
            },
          },
        },
        piano: {
          name: "钢琴",
          icon: "🎹",
          modes: {
            standard: {
              name: "钢琴调音参考",
              strings: [
                { number: 1, note: "C4", freq: 261.63, name: "中央C" },
                { number: 2, note: "A4", freq: 440.0, name: "A4 (标准音)" },
                { number: 3, note: "C3", freq: 130.81, name: "低音C" },
                { number: 4, note: "C5", freq: 523.25, name: "高音C" },
                { number: 5, note: "F3", freq: 174.61, name: "F3" },
                { number: 6, note: "G4", freq: 392.0, name: "G4" },
              ],
              description: "钢琴常用参考音,用于调音和音高训练",
            },
            octaves: {
              name: "C音阶各八度",
              strings: [
                { number: 1, note: "C2", freq: 65.41, name: "C2 (低音)" },
                { number: 2, note: "C3", freq: 130.81, name: "C3" },
                { number: 3, note: "C4", freq: 261.63, name: "C4 (中央C)" },
                { number: 4, note: "C5", freq: 523.25, name: "C5" },
                { number: 5, note: "C6", freq: 1046.5, name: "C6" },
                { number: 6, note: "C7", freq: 2093.0, name: "C7 (高音)" },
              ],
              description: "C音在不同八度的频率,用于八度调音",
            },
          },
        },
      };

      // ========== 乐器调音功能 ==========

      // 选择乐器
      function selectInstrument(instrument) {
        currentInstrument = instrument;
        currentTuningMode = Object.keys(instrumentTunings[instrument].modes)[0];

        // 更新按钮状态
        document.querySelectorAll(".instrument-btn").forEach((btn) => {
          btn.classList.remove("active");
        });
        event.target.classList.add("active");

        // 显示调音区域
        document.getElementById("instrument-tuning-area").style.display =
          "block";

        // 生成调音模式按钮(如果有多个模式)
        const modes = instrumentTunings[instrument].modes;
        const modesDiv = document.getElementById("tuning-modes");

        if (Object.keys(modes).length > 1) {
          modesDiv.style.display = "flex";
          modesDiv.innerHTML = "";

          for (const [key, mode] of Object.entries(modes)) {
            const btn = document.createElement("button");
            btn.className =
              "tuning-mode-btn" + (key === currentTuningMode ? " active" : "");
            btn.textContent = mode.name;
            btn.onclick = () => changeTuningMode(instrument, key);
            modesDiv.appendChild(btn);
          }
        } else {
          modesDiv.style.display = "none";
        }

        // 更新乐器信息和琴弦
        updateInstrumentDisplay();
      }

      // 切换调音模式
      function changeTuningMode(instrument, mode) {
        currentTuningMode = mode;

        // 更新按钮状态
        document.querySelectorAll(".tuning-mode-btn").forEach((btn) => {
          btn.classList.remove("active");
        });
        event.target.classList.add("active");

        updateInstrumentDisplay();
      }

      // 更新乐器显示
      function updateInstrumentDisplay() {
        const instrument = instrumentTunings[currentInstrument];
        const mode = instrument.modes[currentTuningMode];

        // 更新信息面板
        const infoDiv = document.getElementById("instrument-info");
        infoDiv.innerHTML = `
                <h4>${instrument.icon} ${instrument.name} - ${mode.name}</h4>
                <p>${mode.description}</p>
                <p style="font-size: 13px; color: #999; margin-top: 8px;">
                    💡 点击琴弦卡片播放参考音,或启动麦克风进行实时调音
                </p>
            `;

        // 生成琴弦卡片
        const stringDiv = document.getElementById("string-tuner");
        stringDiv.innerHTML = "";

        mode.strings.forEach((string) => {
          const card = document.createElement("div");
          card.className = "string-card";
          card.innerHTML = `
                    <div class="string-number">${string.name}</div>
                    <div class="string-note">${string.note}</div>
                    <div class="string-freq">${string.freq.toFixed(2)} Hz</div>
                `;
          card.onclick = () => playStringNote(string.note, string.freq, card);
          stringDiv.appendChild(card);
        });
      }

      // 播放琴弦音符
      function playStringNote(note, frequency, cardElement) {
        // 初始化音频
        if (!audioContext) {
          initAudio();
          setTimeout(() => {
            playStringNoteInternal(note, frequency, cardElement);
          }, 100);
        } else {
          playStringNoteInternal(note, frequency, cardElement);
        }
      }

      function playStringNoteInternal(note, frequency, cardElement) {
        // 播放声音
        if (audioContext.state === "suspended") {
          audioContext.resume().then(() => {
            playSound(frequency, 2.0, 0.4); // 更长的持续时间,适合调音
          });
        } else {
          playSound(frequency, 2.0, 0.4);
        }

        // 添加视觉反馈
        document.querySelectorAll(".string-card").forEach((card) => {
          card.classList.remove("playing");
        });
        cardElement.classList.add("playing");

        setTimeout(() => {
          cardElement.classList.remove("playing");
        }, 2000);
      }

      // 音符频率映射 (扩展到3个八度)
      const noteFrequenciesExtended = {
        C3: 130.81,
        "C#3": 138.59,
        D3: 146.83,
        "D#3": 155.56,
        E3: 164.81,
        F3: 174.61,
        "F#3": 185.0,
        G3: 196.0,
        "G#3": 207.65,
        A3: 220.0,
        "A#3": 233.08,
        B3: 246.94,

        C4: 261.63,
        "C#4": 277.18,
        D4: 293.66,
        "D#4": 311.13,
        E4: 329.63,
        F4: 349.23,
        "F#4": 369.99,
        G4: 392.0,
        "G#4": 415.3,
        A4: 440.0,
        "A#4": 466.16,
        B4: 493.88,

        C5: 523.25,
        "C#5": 554.37,
        D5: 587.33,
        "D#5": 622.25,
        E5: 659.25,
        F5: 698.46,
        "F#5": 739.99,
        G5: 783.99,
        "G#5": 830.61,
        A5: 880.0,
        "A#5": 932.33,
        B5: 987.77,
      };

      // 音效映射
      const soundFrequencies = {
        woodblock: 1200,
        click: 2000,
        cowbell: 800,
        snare: 400,
        hihat: 3000,
      };

      // 复合拍子的次强拍位置规则
      const secondaryAccentPatterns = {
        "2/4": [],
        "3/4": [],
        "4/4": [2], // 第3拍是次强拍
        "5/4": [3], // 第4拍是次强拍
        "6/8": [3], // 第4拍是次强拍 (两组三连音)
        "7/8": [3, 5], // 2+2+3 或 2+3+2 或 3+2+2 的模式
        "9/8": [3, 6], // 三组三连音,每组第一拍
        "12/8": [3, 6, 9], // 四组三连音
      };

      // 改进的音效播放 - 使用精确的时间调度
      function playSound(frequency, duration = 0.1, volume = 0.3) {
        // 确保音频已初始化
        if (!audioContext || !audioInitialized) {
          console.warn("音频未初始化,尝试初始化...");
          initAudio();
          return;
        }

        try {
          // 使用当前时间而不是延迟调度
          const now = audioContext.currentTime;

          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          // 添加轻微的压缩来避免爆音
          const compressor = audioContext.createDynamicsCompressor();

          oscillator.connect(gainNode);
          gainNode.connect(compressor);
          compressor.connect(audioContext.destination);

          oscillator.frequency.value = frequency;
          oscillator.type = "sine";

          // 使用ADSR包络来避免咔哒声
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(volume, now + 0.005); // 快速上升
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

          oscillator.start(now);
          oscillator.stop(now + duration + 0.1);

          // 清理资源
          setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
            compressor.disconnect();
          }, (duration + 0.2) * 1000);
        } catch (error) {
          console.error("播放音效失败:", error);
        }
      }

      // 更新BPM
      function updateBPM(value) {
        metronomeBPM = parseInt(value);
        document.getElementById("bpm-value").textContent = value;
        document.getElementById("bpm-display").textContent = value;

        if (metronomeRunning) {
          stopMetronome();
          startMetronome();
        }
      }

      // 更新音量
      function updateVolume(value) {
        masterVolume = value / 100;
        document.getElementById("volume-value").textContent = value + "%";

        // 更新音量条显示
        const bars = document.querySelectorAll(".volume-bar");
        const activeCount = Math.ceil((value / 100) * bars.length);

        bars.forEach((bar, index) => {
          if (index < activeCount) {
            bar.classList.add("active");
          } else {
            bar.classList.remove("active");
          }
        });
      }

      // 更新节拍
      function updateTimeSignature() {
        const sig = document.getElementById("time-signature").value.split("/");
        timeSignature = [parseInt(sig[0]), parseInt(sig[1])];

        // 更新节拍指示器
        const indicator = document.getElementById("beat-indicator");
        indicator.innerHTML = "";
        for (let i = 0; i < timeSignature[0]; i++) {
          const dot = document.createElement("div");
          dot.className = "beat-dot";
          indicator.appendChild(dot);
        }

        currentBeat = 0;
      }

      // 启动节拍器 - 使用精确的调度系统
      function startMetronome() {
        metronomeRunning = true;
        document.getElementById("metronome-status").classList.add("active");
        document.getElementById("start-stop-btn").textContent = "停止";
        document
          .getElementById("start-stop-btn")
          .classList.remove("btn-primary");
        document.getElementById("start-stop-btn").classList.add("btn-danger");

        currentBeat = 0;
        let nextBeatTime = audioContext.currentTime;
        const beatInterval = 60.0 / metronomeBPM;

        // 使用递归定时器来保持精确的节拍
        function scheduleBeat() {
          if (!metronomeRunning) return;

          const now = audioContext.currentTime;

          // 提前调度下一个节拍(提前100ms)
          while (nextBeatTime < now + 0.1) {
            scheduleNote(nextBeatTime, currentBeat);
            nextBeatTime += beatInterval;
            currentBeat = (currentBeat + 1) % timeSignature[0];
          }

          // 每25ms检查一次是否需要调度新的节拍
          metronomeInterval = setTimeout(scheduleBeat, 25);
        }

        scheduleBeat();
      }

      // 调度单个节拍
      function scheduleNote(time, beat) {
        const dots = document.querySelectorAll(".beat-dot");

        // 使用setTimeout来更新UI(在正确的时间)
        const timeUntilBeat = (time - audioContext.currentTime) * 1000;

        setTimeout(() => {
          dots.forEach((dot) => {
            dot.classList.remove("active", "accent", "secondary");
          });

          if (beat < dots.length) {
            const timeSig = document.getElementById("time-signature").value;
            const secondaryBeats = secondaryAccentPatterns[timeSig] || [];

            if (beat === 0) {
              // 强拍 - 最响
              const accentSound = document.getElementById("accent-sound").value;
              const freq = soundFrequencies[accentSound];
              scheduleSound(time, freq, 0.08, 1 * masterVolume); // 0.5 → 0.7
            } else if (secondaryBeats.includes(beat)) {
              // 次强拍 - 中等音量,使用次强拍音效
              const secondarySound =
                document.getElementById("secondary-sound").value;
              const freq = soundFrequencies[secondarySound];
              scheduleSound(time, freq, 0.06, 0.7 * masterVolume); // 0.35 → 0.5
            } else {
              // 弱拍 - 较轻
              const regularSound =
                document.getElementById("regular-sound").value;
              const freq = soundFrequencies[regularSound];
              scheduleSound(time, freq, 0.05, 0.9 * masterVolume); // 0.25 → 0.4
            }
          }
        }, Math.max(0, timeUntilBeat));

        // 播放声音 - 根据拍子类型调整音量
        const timeSig = document.getElementById("time-signature").value;
        const secondaryBeats = secondaryAccentPatterns[timeSig] || [];

        if (beat === 0) {
          // 强拍 - 最响
          const accentSound = document.getElementById("accent-sound").value;
          const freq = soundFrequencies[accentSound];
          scheduleSound(time, freq, 0.08, 0.5 * masterVolume);
        } else if (secondaryBeats.includes(beat)) {
          // 次强拍 - 中等音量,使用次强拍音效
          const secondarySound =
            document.getElementById("secondary-sound").value;
          const freq = soundFrequencies[secondarySound];
          scheduleSound(time, freq, 0.06, 0.35 * masterVolume);
        } else {
          // 弱拍 - 较轻
          const regularSound = document.getElementById("regular-sound").value;
          const freq = soundFrequencies[regularSound];
          scheduleSound(time, freq, 0.05, 0.25 * masterVolume);
        }
      }

      // 精确调度声音
      function scheduleSound(time, frequency, duration, volume) {
        try {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          const compressor = audioContext.createDynamicsCompressor();

          oscillator.connect(gainNode);
          gainNode.connect(compressor);
          compressor.connect(audioContext.destination);

          oscillator.frequency.value = frequency;
          oscillator.type = "sine";

          // ADSR包络
          gainNode.gain.setValueAtTime(0, time);
          gainNode.gain.linearRampToValueAtTime(volume, time + 0.005);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

          oscillator.start(time);
          oscillator.stop(time + duration + 0.1);
        } catch (error) {
          console.error("调度声音失败:", error);
        }
      }

      // 停止节拍器
      function stopMetronome() {
        metronomeRunning = false;
        document.getElementById("metronome-status").classList.remove("active");
        document.getElementById("start-stop-btn").textContent = "开始";
        document
          .getElementById("start-stop-btn")
          .classList.remove("btn-danger");
        document.getElementById("start-stop-btn").classList.add("btn-primary");

        if (metronomeInterval) {
          clearTimeout(metronomeInterval);
          metronomeInterval = null;
        }

        const dots = document.querySelectorAll(".beat-dot");
        dots.forEach((dot) => {
          dot.classList.remove("active", "accent");
        });

        currentBeat = 0;
      }

      // 切换节拍器
      function toggleMetronome() {
        // 首次使用时初始化音频
        if (!audioContext) {
          initAudio();
        }

        if (metronomeRunning) {
          stopMetronome();
        } else {
          // 确保音频已就绪
          if (audioContext && audioContext.state === "suspended") {
            audioContext.resume().then(() => {
              startMetronome();
            });
          } else {
            startMetronome();
          }
        }
      }

      // Tap Tempo功能
      function tapTempo() {
        const now = Date.now();
        tapTimes.push(now);

        // 只保留最近4次点击
        if (tapTimes.length > 4) {
          tapTimes.shift();
        }

        if (tapTimes.length >= 2) {
          const intervals = [];
          for (let i = 1; i < tapTimes.length; i++) {
            intervals.push(tapTimes[i] - tapTimes[i - 1]);
          }

          const avgInterval =
            intervals.reduce((a, b) => a + b) / intervals.length;
          const bpm = Math.round(60000 / avgInterval);

          if (bpm >= 40 && bpm <= 240) {
            document.getElementById("bpm-slider").value = bpm;
            updateBPM(bpm);
          }
        }

        // 5秒后重置
        setTimeout(() => {
          tapTimes = [];
        }, 5000);
      }

      // 播放音符 - 更新为支持钢琴键盘
      function playNote(note, frequency) {
        // 初始化音频
        if (!audioContext) {
          initAudio();
          setTimeout(() => {
            playNoteInternal(note, frequency);
          }, 100);
        } else {
          playNoteInternal(note, frequency);
        }
      }

      function playNoteInternal(note, frequency) {
        // 确保音频上下文已恢复
        if (audioContext.state === "suspended") {
          audioContext.resume().then(() => {
            playSound(frequency, 1.5, 0.4);
          });
        } else {
          playSound(frequency, 1.5, 0.4);
        }

        // 高亮按下的键
        highlightKey(note);
      }

      // 高亮钢琴键
      function highlightKey(note) {
        // 移除所有高亮
        document.querySelectorAll(".white-key, .black-key").forEach((key) => {
          key.classList.remove("playing");
        });

        // 高亮当前键
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) {
          key.classList.add("playing");
          setTimeout(() => {
            key.classList.remove("playing");
          }, 300);
        }
      }

      // 生成钢琴键盘
      function generatePianoKeyboard(octave) {
        const keyboard = document.getElementById("piano-keyboard");
        keyboard.innerHTML = "";

        const octaveDiv = document.createElement("div");
        octaveDiv.className = "piano-octave";

        // 白键
        const whiteNotes = ["C", "D", "E", "F", "G", "A", "B"];
        whiteNotes.forEach((note) => {
          const noteName = note + octave;
          const frequency = noteFrequenciesExtended[noteName];

          const key = document.createElement("div");
          key.className = "white-key";
          key.dataset.note = noteName;
          key.innerHTML = `<span>${note}${octave}</span>`;
          key.onclick = () => playNote(noteName, frequency);
          octaveDiv.appendChild(key);
        });

        // 黑键
        const blackNotes = [
          { note: "C#", class: "black-key-cs" },
          { note: "D#", class: "black-key-ds" },
          { note: "F#", class: "black-key-fs" },
          { note: "G#", class: "black-key-gs" },
          { note: "A#", class: "black-key-as" },
        ];

        blackNotes.forEach(({ note, class: className }) => {
          const noteName = note + octave;
          const frequency = noteFrequenciesExtended[noteName];

          const key = document.createElement("div");
          key.className = `black-key ${className}`;
          key.dataset.note = noteName;
          key.innerHTML = `<span>${note}</span>`;
          key.onclick = () => playNote(noteName, frequency);
          octaveDiv.appendChild(key);
        });

        keyboard.appendChild(octaveDiv);
      }

      // 切换八度
      function changeOctave(octave) {
        currentOctave = octave;

        // 更新按钮状态
        document.querySelectorAll(".octave-btn").forEach((btn) => {
          btn.classList.remove("active");
        });
        event.target.classList.add("active");

        // 更新标签
        const labels = {
          3: "低音区 (C3) 八度",
          4: "中央C (C4) 八度",
          5: "高音区 (C5) 八度",
        };
        document.getElementById("octave-label").textContent = labels[octave];

        // 重新生成键盘
        generatePianoKeyboard(octave);
      }

      // 播放半音阶 - 更新为当前八度
      function playChromatic() {
        if (!audioContext) {
          initAudio();
        }

        const notes = [
          "C",
          "C#",
          "D",
          "D#",
          "E",
          "F",
          "F#",
          "G",
          "G#",
          "A",
          "A#",
          "B",
        ];
        let index = 0;

        const interval = setInterval(() => {
          if (index < notes.length) {
            const noteName = notes[index] + currentOctave;
            const frequency = noteFrequenciesExtended[noteName];
            playNote(noteName, frequency);
            index++;
          } else {
            clearInterval(interval);
          }
        }, 500);
      }

      // ========== 主题控制功能 ==========

      // 切换背景色
      function changeBackground(color) {
        if (isDarkMode) {
          // 如果在夜间模式,先退出
          toggleDarkMode();
        }

        currentBackground = color;
        document.body.style.backgroundColor = color; // 改用 backgroundColor

        // 更新选中状态
        document.querySelectorAll(".color-option").forEach((option) => {
          option.classList.remove("active");
        });
        event.target.classList.add("active");

        // 保存设置
        saveThemeSettings();
      }

      // 切换夜间模式
      function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle("dark-mode");

        const btn = document.querySelector(".dark-mode-toggle");
        if (isDarkMode) {
          btn.textContent = "☀️ 切换日间模式";
          document.body.style.backgroundColor = "#1a1a2e"; // 改用 backgroundColor
        } else {
          btn.textContent = "🌙 切换夜间模式";
          // 恢复之前的背景色
          document.body.style.backgroundColor = currentBackground; // 改用 backgroundColor
        }

        // 保存设置
        saveThemeSettings();
      }

      // 保存主题设置
      function saveThemeSettings() {
        const themeSettings = {
          isDarkMode: isDarkMode,
          background: currentBackground,
        };
        localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
      }

      // 加载主题设置
      function loadThemeSettings() {
        const saved = localStorage.getItem("themeSettings");
        if (saved) {
          try {
            const settings = JSON.parse(saved);

            // 恢复背景色
            if (settings.background) {
              currentBackground = settings.background;
              if (!settings.isDarkMode) {
                document.body.style.background = settings.background;
              }

              // 更新选中的颜色选项
              document.querySelectorAll(".color-option").forEach((option) => {
                if (option.style.background === settings.background) {
                  option.classList.add("active");
                } else {
                  option.classList.remove("active");
                }
              });
            }

            // 恢复夜间模式
            if (settings.isDarkMode && !isDarkMode) {
              toggleDarkMode();
            }

            console.log("主题设置已加载");
          } catch (e) {
            console.error("加载主题设置失败:", e);
          }
        }
      }

      // 播放C大调音阶
      function playMajorScale() {
        if (!audioContext) {
          initAudio();
        }

        const notes = ["C", "D", "E", "F", "G", "A", "B", "C"];
        const octaves =
          currentOctave === 5
            ? [5, 5, 5, 5, 5, 5, 5, 6]
            : Array(8).fill(currentOctave);

        let index = 0;
        const interval = setInterval(() => {
          if (index < notes.length) {
            const octave =
              index === 7 && currentOctave < 5
                ? currentOctave + 1
                : currentOctave;
            const noteName = notes[index] + octave;
            const frequency =
              noteFrequenciesExtended[noteName] ||
              noteFrequenciesExtended[notes[index] + currentOctave] * 2;
            playNote(noteName, frequency);
            index++;
          } else {
            clearInterval(interval);
          }
        }, 500);
      }

      // ========== 麦克风音高检测功能 ==========

      // 启动/停止麦克风
      async function toggleMicrophone() {
        if (isListening) {
          stopMicrophone();
        } else {
          await startMicrophone();
        }
      }

      // 启动麦克风
      async function startMicrophone() {
        try {
          // 初始化音频上下文
          if (!audioContext) {
            initAudio();
          }

          // 请求麦克风权限
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
          });

          // 创建音频分析器
          const source = audioContext.createMediaStreamSource(micStream);
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 4096; // 更高的FFT尺寸以获得更好的频率分辨率
          analyser.smoothingTimeConstant = 0.8;

          source.connect(analyser);

          bufferLength = analyser.frequencyBinCount;
          dataArray = new Uint8Array(bufferLength);

          isListening = true;

          // 更新UI
          document.getElementById("mic-button").textContent = "🔴 停止检测";
          document.getElementById("mic-button").classList.add("recording");
          document.getElementById("tuning-info").style.display = "block";
          document.getElementById("tuning-gauge").style.display = "block";
          document.getElementById("waveform-canvas").style.display = "block";
          document.getElementById("tuner-status").textContent = "正在监听...";

          // 开始检测音高
          detectPitch();
        } catch (error) {
          console.error("麦克风访问失败:", error);
          alert("无法访问麦克风。请确保已授予麦克风权限。");
        }
      }

      // 停止麦克风
      function stopMicrophone() {
        isListening = false;

        if (micStream) {
          micStream.getTracks().forEach((track) => track.stop());
          micStream = null;
        }

        if (pitchDetectionInterval) {
          cancelAnimationFrame(pitchDetectionInterval);
        }

        // 更新UI
        document.getElementById("mic-button").textContent = "🎤 启动麦克风检测";
        document.getElementById("mic-button").classList.remove("recording");
        document.getElementById("tuner-status").textContent = "已停止检测";
      }

      // 音高检测主循环
      function detectPitch() {
        if (!isListening) return;

        analyser.getByteFrequencyData(dataArray);

        // 检测主频率
        const frequency = autoCorrelate(dataArray, audioContext.sampleRate);

        if (frequency > 0) {
          // 找到最接近的音符
          const noteInfo = findClosestNote(frequency);

          // 更新显示
          updateTunerDisplay(noteInfo, frequency);

          // 绘制波形
          drawWaveform();
        }

        pitchDetectionInterval = requestAnimationFrame(detectPitch);
      }

      // 自相关算法检测音高 (更准确的基频检测)
      function autoCorrelate(buffer, sampleRate) {
        // 转换为浮点数组
        const float32Array = new Float32Array(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
          float32Array[i] = (buffer[i] - 128) / 128.0;
        }

        // 计算RMS (音量检测)
        let rms = 0;
        for (let i = 0; i < float32Array.length; i++) {
          rms += float32Array[i] * float32Array[i];
        }
        rms = Math.sqrt(rms / float32Array.length);

        // 音量太小则返回-1
        if (rms < 0.01) return -1;

        // 自相关
        let maxCorrelation = 0;
        let bestOffset = -1;
        let foundGoodCorrelation = false;

        const minOffset = Math.floor(sampleRate / 1000); // 最高1000Hz
        const maxOffset = Math.floor(sampleRate / 50); // 最低50Hz

        for (let offset = minOffset; offset < maxOffset; offset++) {
          let correlation = 0;

          for (let i = 0; i < float32Array.length - offset; i++) {
            correlation += Math.abs(float32Array[i] - float32Array[i + offset]);
          }

          correlation = 1 - correlation / (float32Array.length - offset);

          if (correlation > 0.9 && correlation > maxCorrelation) {
            maxCorrelation = correlation;
            bestOffset = offset;
            foundGoodCorrelation = true;
          }
        }

        if (foundGoodCorrelation) {
          return sampleRate / bestOffset;
        }

        return -1;
      }

      // 找到最接近的音符
      function findClosestNote(frequency) {
        let closestNote = null;
        let closestDistance = Infinity;
        let closestOctave = 0;

        for (const [note, octaves] of Object.entries(noteFrequencies)) {
          for (let i = 0; i < octaves.length; i++) {
            const noteFreq = octaves[i];
            const distance = Math.abs(frequency - noteFreq);

            if (distance < closestDistance) {
              closestDistance = distance;
              closestNote = note;
              closestOctave = i;
            }
          }
        }

        const exactFreq = noteFrequencies[closestNote][closestOctave];

        // 计算音分 (cents): 100 cents = 1 半音
        const cents = Math.floor(1200 * Math.log2(frequency / exactFreq));

        return {
          note: closestNote,
          octave: closestOctave,
          frequency: exactFreq,
          cents: cents,
        };
      }

      // 更新调音器显示
      function updateTunerDisplay(noteInfo, detectedFreq) {
        const noteName = `${noteInfo.note}${noteInfo.octave}`;
        document.getElementById("detected-note").textContent = noteName;
        document.getElementById("detected-freq").textContent =
          detectedFreq.toFixed(2);

        const centsDisplay = document.getElementById("cents-display");
        const cents = noteInfo.cents;

        // 检查是否匹配当前乐器的琴弦
        let matchString = null;
        if (currentInstrument) {
          const mode =
            instrumentTunings[currentInstrument].modes[currentTuningMode];
          matchString = mode.strings.find((s) => s.note === noteName);
        }

        if (Math.abs(cents) <= 5) {
          centsDisplay.textContent = matchString
            ? `${matchString.name} 音准✓`
            : "音准✓";
          centsDisplay.className = "cents-display intune";

          // 高亮匹配的琴弦卡片
          if (matchString) {
            highlightMatchingString(matchString.number);
          }
        } else if (cents > 0) {
          centsDisplay.textContent = `偏高 +${cents}¢`;
          centsDisplay.className = "cents-display sharp";
        } else {
          centsDisplay.textContent = `偏低 ${cents}¢`;
          centsDisplay.className = "cents-display flat";
        }

        // 更新指针
        const needle = document.getElementById("gauge-needle");
        const angle = Math.max(-45, Math.min(45, cents * 0.9));
        needle.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
      }

      // 高亮匹配的琴弦
      function highlightMatchingString(stringNumber) {
        document.querySelectorAll(".string-card").forEach((card, index) => {
          card.classList.remove("playing");
        });

        const cards = document.querySelectorAll(".string-card");
        const matchIndex = stringNumber - 1;
        if (cards[matchIndex]) {
          cards[matchIndex].classList.add("playing");
          setTimeout(() => {
            cards[matchIndex].classList.remove("playing");
          }, 1000);
        }
      }

      // 绘制波形
      function drawWaveform() {
        const canvas = document.getElementById("waveform-canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#667eea";
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }

      // 切换标签页
      function switchTab(tabName) {
        // 停止节拍器
        if (metronomeRunning) {
          stopMetronome();
        }

        // 停止麦克风检测
        if (isListening) {
          stopMicrophone();
        }

        // 更新标签
        document.querySelectorAll(".tab").forEach((tab) => {
          tab.classList.remove("active");
        });
        event.target.classList.add("active");

        // 更新内容
        document.querySelectorAll(".tab-content").forEach((content) => {
          content.classList.remove("active");
        });
        document.getElementById(tabName).classList.add("active");
      }

      // 保存设置
      function saveSettings() {
        const settings = {
          bpm: metronomeBPM,
          volume: masterVolume,
          timeSignature: document.getElementById("time-signature").value,
          accentSound: document.getElementById("accent-sound").value,
          secondarySound: document.getElementById("secondary-sound").value,
          regularSound: document.getElementById("regular-sound").value,
        };

        localStorage.setItem("metronomeSettings", JSON.stringify(settings));
        alert("设置已保存!");
      }

      // 加载设置
      function loadSettings() {
        const saved = localStorage.getItem("metronomeSettings");
        if (saved) {
          const settings = JSON.parse(saved);

          document.getElementById("bpm-slider").value = settings.bpm;
          updateBPM(settings.bpm);

          if (settings.volume !== undefined) {
            const volumePercent = Math.round(settings.volume * 100);
            document.getElementById("volume-slider").value = volumePercent;
            updateVolume(volumePercent);
          }

          document.getElementById("time-signature").value =
            settings.timeSignature;
          updateTimeSignature();

          document.getElementById("accent-sound").value = settings.accentSound;
          if (settings.secondarySound) {
            document.getElementById("secondary-sound").value =
              settings.secondarySound;
          }
          document.getElementById("regular-sound").value =
            settings.regularSound;

          alert("设置已加载!");
        } else {
          alert("没有找到保存的设置");
        }
      }

      // 页面加载时自动加载设置
      window.onload = function () {
        console.log("页面加载完成");

        // 添加点击监听器来初始化音频
        document.body.addEventListener(
          "click",
          function initOnClick() {
            if (!audioContext) {
              console.log("用户首次点击,初始化音频...");
              initAudio();
            }
          },
          { once: false }
        ); // 不使用once,以便多次尝试

        // 加载保存的设置
        const saved = localStorage.getItem("metronomeSettings");
        if (saved) {
          try {
            const settings = JSON.parse(saved);

            document.getElementById("bpm-slider").value = settings.bpm;
            updateBPM(settings.bpm);

            if (settings.volume !== undefined) {
              const volumePercent = Math.round(settings.volume * 100);
              document.getElementById("volume-slider").value = volumePercent;
              updateVolume(volumePercent);
            }

            document.getElementById("time-signature").value =
              settings.timeSignature;
            updateTimeSignature();

            document.getElementById("accent-sound").value =
              settings.accentSound;
            if (settings.secondarySound) {
              document.getElementById("secondary-sound").value =
                settings.secondarySound;
            }
            document.getElementById("regular-sound").value =
              settings.regularSound;

            console.log("设置已自动加载");
          } catch (e) {
            console.error("加载设置失败:", e);
          }
        }

        // 初始化音量显示
        updateVolume(70);

        // 初始化钢琴键盘
        generatePianoKeyboard(4);

        // 加载主题设置
        loadThemeSettings();

        // 显示音频状态提示
        setTimeout(() => {
          if (!audioInitialized) {
            console.log("提示: 请点击页面任意位置以启用音频");
          }
        }, 1000);
        initBPMPresets();
        loadInfoPanelState();
      };