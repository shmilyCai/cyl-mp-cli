import { basePage } from "../base/basePage";
import { API } from "../api/api";

//获取应用实例
const app = getApp();

basePage({
  /**
   * 页面的初始数据
   */
  data: {
    title: "hello 这是一个页面的模板 ~ !!"
  },
  /**
   * 页面加载
   */
  onLoad: function() {
    this.loadData();
  },
  /**
   *
   */
  loadData: function() {
    let newParam = {};
    let handleDataFunc = function() {};
    this.loadMore(API.TEST, {
      newParam,
      handleDataFunc
    });
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  refreshData() {
    let newParam = {};
    this.refresh(API.TEST, {
      newParam,
      refresh: true
    });
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    this.loadData();
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.refreshData();
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {}
});
