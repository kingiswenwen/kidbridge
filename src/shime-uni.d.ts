export {}

declare module "vue" {
  type Hooks = App.AppInstance & Page.PageInstance;
  interface ComponentCustomOptions extends Hooks {}
  // uni-app 运行时注入的全局对象。vue-tsc 的模板类型检查不会纳入 ambient 全局
  // 声明，这里挂到组件实例上，使模板里 uni.navigateBack / uni.switchTab 等通过检查。
  interface ComponentCustomProperties {
    uni: any;
  }
}