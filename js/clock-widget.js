// clock-widget.js - 侧边栏时钟插件功能
(function() {
  'use strict';
  
  // 配置选项
  const config = {
    enableWeather: true, // 是否启用天气显示
    weatherAPI: 'https://api.qweather.com/v7/weather/now', // 天气API
    weatherKey: '', // 和风天气API密钥（需要申请）
    locationAPI: 'https://ipapi.co/json/', // IP定位API
    updateInterval: 1000, // 时间更新间隔(ms)
    retryDelay: 3000, // 重试延迟(ms)
    maxRetries: 3 // 最大重试次数
  };
  
  // 全局变量
  let retryCount = 0;
  let currentCity = '';
  
  // 主初始化函数
  function initClockWidget() {
    // 检查是否已存在时钟部件
    if (document.getElementById('anzhiyu-clock-widget')) {
      return;
    }
    
    // 创建时钟部件HTML
    const clockHTML = `
      <div class="clock-widget" id="anzhiyu-clock-widget">
        <div class="clock-title">
          <svg class="clock-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13h-1v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
          </svg>
          时钟 · 定位
        </div>
        <div class="clock-time" id="clock-time">00:00:00</div>
        <div class="clock-date" id="clock-date">加载中...</div>
        <div class="clock-location">
          <svg class="clock-icon" viewBox="0 0 24 24">
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"/>
          </svg>
          <span id="location-info" class="clock-loading">定位中...</span>
        </div>
        ${config.enableWeather ? `
        <div class="clock-weather">
          <svg class="clock-icon" viewBox="0 0 24 24">
            <path d="M19.5 12.5c0 1.3-.5 2.5-1.3 3.4-.8.9-1.9 1.4-3.1 1.4H7c-2.2 0-4-1.8-4-4 0-2.1 1.7-3.9 3.8-4 .3-2.4 2.3-4.3 4.7-4.3 2.1 0 3.9 1.4 4.5 3.3 1.3.3 2.5 1.2 2.5 2.8z"/>
          </svg>
          <span id="weather-info" class="clock-loading">天气加载中...</span>
        </div>
        ` : ''}
      </div>
    `;
    
    // 尝试插入到侧边栏
    const sidebar = findSidebar();
    if (sidebar) {
      sidebar.insertAdjacentHTML('afterbegin', clockHTML);
      initializeClockFunctions();
    } else {
      // 如果侧边栏不存在，等待一段时间后重试
      if (retryCount < config.maxRetries) {
        retryCount++;
        setTimeout(initClockWidget, config.retryDelay);
      } else {
        console.warn('时钟插件: 无法找到侧边栏容器，已放弃初始化');
      }
    }
  }
  
  // 查找侧边栏容器
  function findSidebar() {
    const selectors = [
      '#aside', 
      '.aside', 
      '.sidebar', 
      '.sticky_layout',
      '.site-aside',
      '[role="complementary"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    
    return null;
  }
  
  // 初始化时钟功能
  function initializeClockFunctions() {
    updateClock(); // 立即更新一次
    setInterval(updateClock, config.updateInterval);
    
    getLocationInfo();
    
    if (config.enableWeather && config.weatherKey) {
      // 等待位置信息获取后再获取天气
      setTimeout(getWeatherInfo, 1000);
    }
  }
  
  // 更新时间显示
  function updateClock() {
    const now = new Date();
    const timeElement = document.getElementById('clock-time');
    const dateElement = document.getElementById('clock-date');
    
    if (!timeElement || !dateElement) return;
    
    // 格式化时间
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // 格式化日期
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[now.getDay()];
    
    timeElement.textContent = `${hours}:${minutes}:${seconds}`;
    dateElement.textContent = `${year}年${month}月${day}日 ${weekday}`;
  }
  
  // 获取地理位置信息
  function getLocationInfo() {
    const locationElement = document.getElementById('location-info');
    if (!locationElement) return;
    
    fetch(config.locationAPI)
      .then(response => {
        if (!response.ok) throw new Error('网络响应不正常');
        return response.json();
      })
      .then(data => {
        const city = data.city || '未知城市';
        const region = data.region || data.regionName || '';
        const country = data.country_name || '未知国家';
        
        currentCity = city; // 保存城市信息用于天气查询
        
        let locationText = city;
        if (region && region !== city) {
          locationText += `, ${region}`;
        }
        locationText += `, ${country}`;
        
        locationElement.textContent = locationText;
        locationElement.classList.remove('clock-loading');
      })
      .catch(error => {
        console.error('时钟插件: 定位失败', error);
        locationElement.textContent = '定位失败';
        locationElement.classList.remove('clock-loading');
      });
  }
  
  // 获取天气信息
  function getWeatherInfo() {
    if (!currentCity || !config.weatherKey) return;
    
    const weatherElement = document.getElementById('weather-info');
    if (!weatherElement) return;
    
    // 这里需要先根据城市名称获取位置ID，然后查询天气
    // 简化版：直接使用IP定位的城市查询天气
    const locationAPI = `https://geoapi.qweather.com/v2/city/lookup?key=${config.weatherKey}&location=${encodeURIComponent(currentCity)}`;
    
    fetch(locationAPI)
      .then(response => response.json())
      .then(data => {
        if (data.code === '200' && data.location && data.location.length > 0) {
          const locationId = data.location[0].id;
          return fetch(`${config.weatherAPI}?key=${config.weatherKey}&location=${locationId}`);
        }
        throw new Error('无法获取位置ID');
      })
      .then(response => response.json())
      .then(data => {
        if (data.code === '200') {
          const temp = data.now.temp;
          const text = data.now.text;
          weatherElement.textContent = `${text} ${temp}°C`;
          weatherElement.classList.remove('clock-loading');
        } else {
          throw new Error('天气数据错误');
        }
      })
      .catch(error => {
        console.error('时钟插件: 天气获取失败', error);
        weatherElement.textContent = '天气获取失败';
        weatherElement.classList.remove('clock-loading');
      });
  }
  
  // PJAX支持
  function setupPJAXSupport() {
    if (typeof pjax !== 'undefined') {
      document.addEventListener('pjax:complete', function() {
        // 移除旧的时钟部件
        const oldClock = document.getElementById('anzhiyu-clock-widget');
        if (oldClock) {
          oldClock.remove();
        }
        
        // 重置重试计数
        retryCount = 0;
        
        // 重新初始化
        setTimeout(initClockWidget, 300);
      });
    }
  }
  
  // 主题变化监听
  function setupThemeListener() {
    // 监听主题变化，重新应用样式
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // 主题变化时，可以在这里添加特定的处理逻辑
        }
      });
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  
  // 初始化
  document.addEventListener('DOMContentLoaded', function() {
    // 添加CSS样式
    if (!document.getElementById('clock-widget-css')) {
      const link = document.createElement('link');
      link.id = 'clock-widget-css';
      link.rel = 'stylesheet';
      link.href = '/css/clock-widget.css';
      document.head.appendChild(link);
    }
    
    // 初始化时钟部件
    initClockWidget();
    
    // 设置PJAX支持
    setupPJAXSupport();
    
    // 设置主题监听
    setupThemeListener();
  });
  
  // 全局暴露初始化函数，以便手动调用
  window.reinitClockWidget = function() {
    const oldClock = document.getElementById('anzhiyu-clock-widget');
    if (oldClock) {
      oldClock.remove();
    }
    retryCount = 0;
    initClockWidget();
  };
})();